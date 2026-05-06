import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient, PersonalTriangleMessage, AbusserThoughtJournalEntry } from '../hooks/usePatient';
import api from '../api/client';

const PERSONA_LABELS = {
  victim: { ar: 'الضحيه', emoji: '🟢', color: '#10B981' },
  abuser: { ar: 'الجاني', emoji: '🔴', color: '#EF4444' },
  bystander: { ar: 'المتفرج', emoji: '🔵', color: '#3B82F6' }
};

const MESSAGE_DIRECTIONS = [
  { from: 'abuser', to: 'victim' },
  { from: 'abuser', to: 'bystander' },
  { from: 'victim', to: 'abuser' },
  { from: 'victim', to: 'bystander' },
  { from: 'bystander', to: 'abuser' },
  { from: 'bystander', to: 'victim' }
] as const;

export default function PersonalTriangleView() {
  const navigate = useNavigate();
  const { tools, fetchMe } = usePatient();
  const [toolId, setToolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalTriangleMessage[]>([]);
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
      // Fetch the tool's messages and entries
      Promise.all([
        api.get(`/tools/${existingTool.id}/triangle/messages`),
        api.get(`/tools/${existingTool.id}/journal/entries`)
      ]).then(([messagesRes, entriesRes]) => {
        setMessages(messagesRes.data.messages || []);
        setEntries(entriesRes.data.entries || []);
      }).catch((err) => {
        setError((err as any).response?.data?.error || 'خطأ في تحميل البيانات');
      });
    } else {
      setError('لم يتم العثور على أداة المثلث الشخصي');
    }
  }, [tools]);

  const getMessage = (from: string, to: string) => {
    return messages.find(m => m.from_persona === from && m.to_persona === to);
  };

  const recentEntries = entries.slice(0, 7);
  const messageCount = messages.length;

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>;

  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-300 p-6 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => window.print()}
              className="text-sm btn-primary"
            >
              🖨️ طباعة
            </button>
          </div>
          <h1 className="text-3xl font-bold text-center">المثلث الشخصي</h1>
          <p className="text-center text-gray-600 mt-2">رسالة داخلية بين ثلاث أصوات</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Triangle Visualization */}
          <div className="flex justify-center">
            <svg width="400" height="350" viewBox="0 0 400 350" className="max-w-full border border-gray-300 rounded">
              <defs>
                <marker id="arrowgreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                </marker>
                <marker id="arrowred" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
                </marker>
                <marker id="arrowblue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#3B82F6" />
                </marker>
              </defs>

              {/* Edges */}
              <path d="M 200,50 Q 150,150 100,280" stroke="#EF4444" strokeWidth="2" fill="none" markerEnd="url(#arrowred)" opacity="0.6" />
              <path d="M 200,50 Q 250,150 300,280" stroke="#EF4444" strokeWidth="2" fill="none" markerEnd="url(#arrowred)" opacity="0.6" />
              <path d="M 100,280 Q 200,200 200,50" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowgreen)" opacity="0.6" />
              <path d="M 100,280 Q 200,200 300,280" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowgreen)" opacity="0.6" />
              <path d="M 300,280 Q 200,200 200,50" stroke="#3B82F6" strokeWidth="2" fill="none" markerEnd="url(#arrowblue)" opacity="0.6" />
              <path d="M 300,280 Q 200,200 100,280" stroke="#3B82F6" strokeWidth="2" fill="none" markerEnd="url(#arrowblue)" opacity="0.6" />

              {/* Vertices */}
              <circle cx="200" cy="50" r="35" fill="#10B981" opacity="0.2" />
              <circle cx="100" cy="280" r="35" fill="#EF4444" opacity="0.2" />
              <circle cx="300" cy="280" r="35" fill="#3B82F6" opacity="0.2" />

              {/* Labels */}
              <text x="200" y="55" textAnchor="middle" fontSize="20">🟢</text>
              <text x="200" y="80" textAnchor="middle" fontSize="12" fontWeight="bold">الضحيه</text>

              <text x="100" y="285" textAnchor="middle" fontSize="20">🔴</text>
              <text x="100" y="310" textAnchor="middle" fontSize="12" fontWeight="bold">الجاني</text>

              <text x="300" y="285" textAnchor="middle" fontSize="20">🔵</text>
              <text x="300" y="310" textAnchor="middle" fontSize="12" fontWeight="bold">المتفرج</text>

              {/* Message counts on edges */}
              {MESSAGE_DIRECTIONS.map((dir) => {
                const hasMsg = getMessage(dir.from, dir.to);
                const personaFrom = PERSONA_LABELS[dir.from as keyof typeof PERSONA_LABELS];

                let x = 0, y = 0;
                if (dir.from === 'abuser' && dir.to === 'victim') { x = 130; y = 120; }
                else if (dir.from === 'abuser' && dir.to === 'bystander') { x = 270; y = 120; }
                else if (dir.from === 'victim' && dir.to === 'abuser') { x = 130; y = 220; }
                else if (dir.from === 'victim' && dir.to === 'bystander') { x = 270; y = 220; }
                else if (dir.from === 'bystander' && dir.to === 'abuser') { x = 150; y = 270; }
                else if (dir.from === 'bystander' && dir.to === 'victim') { x = 250; y = 270; }

                return (
                  <g key={`${dir.from}-${dir.to}`}>
                    {hasMsg && (
                      <circle cx={x} cy={y} r="16" fill={personaFrom.color} opacity="0.3" />
                    )}
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold">
                      {hasMsg ? '✓' : '○'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold mb-4">الإحصائيات</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{messageCount}</p>
                <p className="text-sm text-gray-600">إجمالي الرسائل</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {messages.filter(m => m.from_persona === 'abuser').length}
                </p>
                <p className="text-sm text-gray-600">من الجاني</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {messages.filter(m => m.from_persona === 'victim').length}
                </p>
                <p className="text-sm text-gray-600">من الضحية</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {messages.filter(m => m.from_persona === 'bystander').length}
                </p>
                <p className="text-sm text-gray-600">من المتفرج</p>
              </div>
            </div>
          </div>

          {/* All Messages */}
          {messages.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <h2 className="text-xl font-bold mb-4">جميع الرسائل</h2>
              <div className="space-y-4">
                {MESSAGE_DIRECTIONS.map((dir) => {
                  const msg = getMessage(dir.from, dir.to);
                  if (!msg) return null;

                  return (
                    <div key={`${msg.from_persona}-${msg.to_persona}`} className="border-l-4 pl-4 py-2" style={{ borderColor: PERSONA_LABELS[msg.from_persona as keyof typeof PERSONA_LABELS].color }}>
                      <p className="font-medium text-sm mb-2">
                        <span>{PERSONA_LABELS[msg.from_persona as keyof typeof PERSONA_LABELS].emoji}</span>
                        {' ' + PERSONA_LABELS[msg.from_persona as keyof typeof PERSONA_LABELS].ar}
                        {' → '}
                        <span>{PERSONA_LABELS[msg.to_persona as keyof typeof PERSONA_LABELS].emoji}</span>
                        {' ' + PERSONA_LABELS[msg.to_persona as keyof typeof PERSONA_LABELS].ar}
                      </p>
                      <p className="text-gray-700 italic">"{msg.message_text}"</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Journal Entries */}
          {recentEntries.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <h2 className="text-xl font-bold mb-4">آخر 7 أيام من اليوميات</h2>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="border rounded p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{new Date(entry.journal_date).toLocaleDateString('ar-EG')}</h3>
                      <span className={`text-sm font-bold px-3 py-1 rounded ${
                        entry.intensity <= 3 ? 'bg-green-100 text-green-800' :
                        entry.intensity <= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        شدة: {entry.intensity}/10
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>🔴 الفكرة المسيئة:</strong> {entry.abuser_thought}</p>
                      {entry.victim_response && (
                        <p><strong>🟢 رد الضحية:</strong> {entry.victim_response}</p>
                      )}
                      {entry.bystander_analysis && (
                        <p><strong>🔵 تحليل المتفرج:</strong> {entry.bystander_analysis}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 text-center text-gray-600 text-sm">
            <p>المثلث الشخصي — أداة للتواصل الداخلي</p>
            <p className="mt-1">تم إنشاؤها من قبل تطبيق رحلة التعافي</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}
