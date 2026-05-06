import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient, PersonalTriangleMessage } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import api from '../api/client';
import AbusserThoughtJournal from './AbusserThoughtJournal';

interface TriangleEdgeMessage {
  from: 'victim' | 'abuser' | 'bystander';
  to: 'victim' | 'abuser' | 'bystander';
  message: PersonalTriangleMessage | null;
}

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

export default function PersonalTriangle() {
  const navigate = useNavigate();
  const { tools, addTool, fetchMe } = usePatient();

  const [toolId, setToolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalTriangleMessage[]>([]);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'triangle' | 'journal'>('triangle');

  const [selectedFrom, setSelectedFrom] = useState<'victim' | 'abuser' | 'bystander'>('abuser');
  const [selectedTo, setSelectedTo] = useState<'victim' | 'abuser' | 'bystander'>('victim');
  const [composingMessage, setComposingMessage] = useState('');
  const messageRef = useAutoExpandTextarea();

  // Check if user has viewed intro
  useEffect(() => {
    const hasViewedIntro = localStorage.getItem('personalTriangleIntroViewed');
    if (!hasViewedIntro) {
      navigate('/tools/personal-triangle/intro');
    }
  }, [navigate]);

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
      setShared(existingTool.shared_with_therapist);
      // Fetch the tool's messages
      api.get(`/tools/${existingTool.id}/triangle/messages`).then((res) => {
        setMessages(res.data.messages || []);
      });
    }
  }, [tools]);

  const handleSaveMessage = async () => {
    console.log('handleSaveMessage called', { selectedFrom, selectedTo, composingMessage: composingMessage.trim() });

    if (!composingMessage.trim()) {
      setError('الرسالة فارغة');
      return;
    }

    if (selectedFrom === selectedTo) {
      setError('لا يمكن إرسال رسالة للذات');
      return;
    }

    try {
      let currentToolId = toolId;
      console.log('Current tool ID before creation check:', currentToolId);

      // Create tool if it doesn't exist
      if (!currentToolId) {
        console.log('Tool does not exist, creating new personal_triangle tool');
        const createRes = await api.post('/tools', { tool_type: 'personal_triangle' });
        console.log('Tool created:', createRes.data.tool);
        currentToolId = createRes.data.tool.id;
        setToolId(currentToolId);
        addTool(createRes.data.tool);
      }

      console.log('Saving message to tool ID:', currentToolId);
      // Save message
      const res = await api.post(`/tools/${currentToolId}/triangle/messages`, {
        from_persona: selectedFrom,
        to_persona: selectedTo,
        message_text: composingMessage
      });

      console.log('Message saved:', res.data.message);
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.from_persona === selectedFrom && m.to_persona === selectedTo));
        console.log('Updated messages array:', [...filtered, res.data.message]);
        return [...filtered, res.data.message];
      });

      setComposingMessage('');
      setError(null);
    } catch (err) {
      console.error('Error saving message:', err);
      setError((err as any).response?.data?.error || 'خطأ في الحفظ');
    }
  };

  const handleDeleteMessage = async (from: string, to: string) => {
    if (!toolId) return;
    try {
      await api.delete(`/tools/${toolId}/triangle/messages/${from}/${to}`);
      setMessages(prev => prev.filter(m => !(m.from_persona === from && m.to_persona === to)));
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

  const handleExport = () => {
    if (messages.length === 0) {
      setError('لا توجد رسائل لتصديرها');
      return;
    }

    // Generate report content
    let reportContent = 'المثلث الشخصي - تقرير الرسائل\n';
    reportContent += '=' .repeat(50) + '\n\n';
    reportContent += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}\n`;
    reportContent += `عدد الرسائل: ${messages.length}\n\n`;
    reportContent += '=' .repeat(50) + '\n\n';

    // Organize messages by direction
    const directions = [
      { from: 'abuser', to: 'victim', label: '🔴 الجاني → 🟢 الضحيه' },
      { from: 'abuser', to: 'bystander', label: '🔴 الجاني → 🔵 المتفرج' },
      { from: 'victim', to: 'abuser', label: '🟢 الضحيه → 🔴 الجاني' },
      { from: 'victim', to: 'bystander', label: '🟢 الضحيه → 🔵 المتفرج' },
      { from: 'bystander', to: 'abuser', label: '🔵 المتفرج → 🔴 الجاني' },
      { from: 'bystander', to: 'victim', label: '🔵 المتفرج → 🟢 الضحيه' }
    ];

    directions.forEach((dir) => {
      const msg = messages.find(m => m.from_persona === dir.from && m.to_persona === dir.to);
      reportContent += `\n${dir.label}\n`;
      reportContent += '-' .repeat(40) + '\n';
      if (msg) {
        reportContent += `${msg.message_text}\n`;
      } else {
        reportContent += '(لا توجد رسالة)\n';
      }
    });

    reportContent += '\n\n' + '=' .repeat(50) + '\n';
    reportContent += 'ملاحظات:\n';
    reportContent += '- هذا التقرير يحتوي على جميع الرسائل في المثلث الشخصي\n';
    reportContent += '- يمكن مشاركة هذا التقرير مع المعالج\n';
    reportContent += '- حفظ هذا التقرير يساعد في تتبع تطور الحوار الداخلي\n';

    // Download as text file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    link.download = `المثلث_الشخصي_${today}.txt`;
    link.click();

    setError(null);
  };

  const getMessage = (from: string, to: string) => {
    return messages.find(m => m.from_persona === from && m.to_persona === to);
  };

  const getExistingMessage = () => {
    return getMessage(selectedFrom, selectedTo);
  };

  const toOptions = MESSAGE_DIRECTIONS.find(d => d.from === selectedFrom)?.to;
  const placeholders = {
    'abuser→victim': 'اكتب فكرة قاسية أو أمر...',
    'abuser→bystander': 'اكتب دفاع أو تبرير...',
    'victim→abuser': 'اكتب احتجاج أو حد للسلوك...',
    'victim→bystander': 'اطلبي المساعدة أو التحقق...',
    'bystander→abuser': 'اسمي الضرر والحقيقة...',
    'bystander→victim': 'أعطيها التحقق والحماية...'
  } as Record<string, string>;

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">المثلث الشخصي</h1>
        </div>
        <button
          onClick={handleShare}
          disabled={shared}
          className={`px-3 py-1 text-xs sm:text-sm rounded whitespace-nowrap ${shared ? 'bg-gray-200 text-gray-500' : 'btn-primary'}`}
        >
          {shared ? 'مشترك ✓' : 'مشاركة'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 sm:p-4 text-xs sm:text-sm">{error}</div>}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('triangle')}
          className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${activeTab === 'triangle' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
        >
          المثلث
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${activeTab === 'journal' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
        >
          اليوميات
        </button>
      </div>

      {/* Triangle Tab */}
      {activeTab === 'triangle' && (
        <div className="flex-1 overflow-y-auto p-4 pb-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            {/* Triangle SVG */}
            <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto">
              <svg width="400" height="350" viewBox="0 0 400 350" className="w-full max-w-sm sm:max-w-md">
                {/* Draw edges with message counts */}
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

            {/* Export Button */}
            <div className="border-t pt-4 pb-6 text-center">
              <button
                onClick={handleExport}
                className="btn-primary text-sm sm:text-base py-2 sm:py-3"
                title="تصدير تقرير الرسائل"
              >
                📥 تصدير التقرير
              </button>
            </div>

            {/* Message Composer */}
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4 text-center text-sm sm:text-base">اكتب رسالة</h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">من:</label>
                  <select
                    value={selectedFrom}
                    onChange={(e) => {
                      setSelectedFrom(e.target.value as any);
                      setComposingMessage('');
                    }}
                    className="input-base w-full text-xs sm:text-sm"
                  >
                    <option value="victim">الضحيه 🟢</option>
                    <option value="abuser">الجاني 🔴</option>
                    <option value="bystander">المتفرج 🔵</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">إلى:</label>
                  <select
                    value={selectedTo}
                    onChange={(e) => setSelectedTo(e.target.value as any)}
                    className="input-base w-full text-xs sm:text-sm"
                  >
                    {selectedFrom !== 'victim' && <option value="victim">الضحيه 🟢</option>}
                    {selectedFrom !== 'abuser' && <option value="abuser">الجاني 🔴</option>}
                    {selectedFrom !== 'bystander' && <option value="bystander">المتفرج 🔵</option>}
                  </select>
                </div>
              </div>

              <textarea
                ref={messageRef}
                value={composingMessage}
                onChange={(e) => setComposingMessage(e.target.value)}
                placeholder={placeholders[`${selectedFrom}→${selectedTo}` as any]}
                className="input-base w-full mb-2 textarea-auto-expand"
                maxLength={300}
              />

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-500">{composingMessage.length}/300</span>
                {getExistingMessage() && (
                  <button
                    onClick={() => handleDeleteMessage(selectedFrom, selectedTo)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    حذف الرسالة الحالية
                  </button>
                )}
              </div>

              <button
                onClick={handleSaveMessage}
                className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base"
              >
                حفظ الرسالة
              </button>

              {getExistingMessage() && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4 mt-4 text-xs sm:text-sm">
                  <p className="text-gray-700 mb-2"><strong>الرسالة الحالية:</strong></p>
                  <p className="text-gray-600 break-words">"{getExistingMessage()!.message_text}"</p>
                </div>
              )}
            </div>
          </div>

          {/* All Messages Summary */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 pb-6">
            <h3 className="font-bold mb-4 text-sm sm:text-base">جميع الرسائل ({messages.length}/30)</h3>

            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm sm:text-base">لا توجد رسائل حتى الآن</p>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={`${msg.from_persona}-${msg.to_persona}`} className="border rounded p-3 hover:bg-gray-50 active:shadow-lg transition">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <p className="font-medium text-xs sm:text-sm">
                        <span>{PERSONA_LABELS[msg.from_persona as keyof typeof PERSONA_LABELS].emoji}</span>
                        {' → '}
                        <span>{PERSONA_LABELS[msg.to_persona as keyof typeof PERSONA_LABELS].emoji}</span>
                      </p>
                      <button
                        onClick={() => handleDeleteMessage(msg.from_persona, msg.to_persona)}
                        className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        حذف
                      </button>
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm break-words">"{msg.message_text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === 'journal' && <AbusserThoughtJournal />}
    </div>
  );
}
