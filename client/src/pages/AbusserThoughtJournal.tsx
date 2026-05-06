import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient, AbusserThoughtJournalEntry } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import api from '../api/client';

export default function AbusserThoughtJournal() {
  const navigate = useNavigate();
  const { tools, fetchMe } = usePatient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toolId, setToolId] = useState<number | null>(null);

  // Form state for new entry
  const [newThought, setNewThought] = useState('');
  const [intensity, setIntensity] = useState(5);
  const thoughtRef = useAutoExpandTextarea();

  // Entries list
  const [entries, setEntries] = useState<AbusserThoughtJournalEntry[]>([]);

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing personal_triangle tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'personal_triangle');
    if (existingTool) {
      setToolId(existingTool.id);
    } else {
      setError('لم يتم العثور على أداة المثلث الشخصي');
    }
  }, [tools]);

  // Fetch entries
  useEffect(() => {
    if (!toolId) return;

    const fetchEntries = async () => {
      try {
        const res = await api.get(`/tools/${toolId}/journal/entries`);
        // Sort by date descending (newest first)
        const sorted = (res.data.entries || []).sort((a: any, b: any) =>
          new Date(b.journal_date).getTime() - new Date(a.journal_date).getTime()
        );
        setEntries(sorted);
      } catch (err) {
        setError((err as any).response?.data?.error || 'خطأ في تحميل البيانات');
      }
    };

    fetchEntries();
  }, [toolId]);

  const handleAddThought = async () => {
    if (!newThought.trim()) {
      setError('الفكرة مطلوبة');
      return;
    }

    if (!toolId) {
      setError('أداة المثلث الشخصي لم تُنشأ');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.post(`/tools/${toolId}/journal/entries`, {
        journal_date: today,
        abuser_thought: newThought,
        intensity,
        victim_response: null,
        bystander_analysis: null
      });

      // Add new entry to top of list
      setEntries(prev => [res.data.entry, ...prev]);
      setNewThought('');
      setIntensity(5);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: number, date: string) => {
    if (!window.confirm('هل أنت متأكدة من الحذف؟')) return;

    if (!toolId) return;

    try {
      await api.delete(`/tools/${toolId}/journal/entries/${date}`);
      setEntries(prev => prev.filter(e => e.id !== entryId));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحذف');
    }
  };

  const handleExport = async () => {
    if (!toolId) return;

    try {
      const res = await api.get(`/tools/${toolId}/journal/export`);
      const csv = res.data.csv;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      link.download = `رصد_افكار_الجاني_${today}.csv`;
      link.click();
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في التصدير');
    }
  };

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-bold flex-1">رصد افكار الجاني</h1>
        <button
          onClick={handleExport}
          className="text-xs sm:text-sm btn-primary px-2 sm:px-3 py-2 sm:py-2 whitespace-nowrap"
          title="تصدير CSV"
        >
          📥 تصدير
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 sm:p-4 text-xs sm:text-sm">{error}</div>}

      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {/* Add New Thought Form */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 mb-6">
          <h3 className="font-bold text-red-700 mb-3 text-sm sm:text-base">🔴 أضيفي فكرة جديدة</h3>
          <textarea
            ref={thoughtRef}
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder="ما هي الفكرة القاسية التي سمعتيها؟"
            className="input-base w-full mb-3 textarea-auto-expand text-sm sm:text-base"
          />

          <div className="mb-4">
            <label className="text-xs sm:text-sm font-medium block mb-2">
              شدة الفكرة: {intensity}
              <span className="mr-2 text-xs">
                {intensity <= 3 && '😌'}
                {intensity > 3 && intensity <= 6 && '😐'}
                {intensity > 6 && '😤'}
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleAddThought}
            disabled={saving || !newThought.trim()}
            className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base"
          >
            {saving ? 'جاري الإضافة...' : '+ أضيفي الفكرة'}
          </button>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            <p className="text-sm sm:text-base">لا توجد أفكار مسجلة بعد</p>
            <p className="text-xs sm:text-sm mt-2">ابدأي بإضافة الأفكار القاسية التي تسمعينها</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-700 mb-4 text-sm sm:text-base">
              قائمة الأفكار المسجلة ({entries.length})
            </h2>
            {entries.map((entry) => {
              const entryDate = new Date(entry.journal_date);
              const dateStr = entryDate.toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md active:shadow-lg transition"
                >
                  {/* Date Header */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">📅 {dateStr}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        الشدة:
                        <span className={`mr-2 font-bold ${
                          entry.intensity <= 3 ? 'text-green-600' :
                          entry.intensity <= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {entry.intensity}/10
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id, entry.journal_date)}
                      className="text-red-600 hover:text-red-800 text-xs hover:bg-red-50 p-1 rounded flex-shrink-0"
                      title="حذف"
                    >
                      ❌
                    </button>
                  </div>

                  {/* Thought Text */}
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm break-words">{entry.abuser_thought}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
