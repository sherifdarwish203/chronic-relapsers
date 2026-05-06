import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

interface Reason {
  reason_number: number;
  reason_text: string;
}

export default function TwentyReasons() {
  const navigate = useNavigate();
  const { tools, addTool, updateTool, fetchMe } = usePatient();

  const [reasons, setReasons] = useState<Reason[]>(Array.from({ length: 20 }, (_, i) => ({
    reason_number: i + 1,
    reason_text: '',
  })));
  const [toolId, setToolId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing twenty_reasons tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'twenty_reasons');
    if (existingTool) {
      setToolId(existingTool.id);
      setShared(existingTool.shared_with_therapist);
      // Fetch the tool's content
      api.get(`/tools/${existingTool.id}`).then((res) => {
        if (res.data.tool.reasons) {
          const reasonsMap = new Map<number, string>(
            res.data.tool.reasons.map((r: any) => [r.reason_number, r.reason_text])
          );
          setReasons(
            Array.from({ length: 20 }, (_, i) => ({
              reason_number: i + 1,
              reason_text: reasonsMap.get(i + 1) || '',
            }))
          );
        }
      });
    }
  }, [tools]);

  const handleReasonChange = (reasonNumber: number, text: string) => {
    setReasons((prev) =>
      prev.map((r) => (r.reason_number === reasonNumber ? { ...r, reason_text: text } : r))
    );
  };

  const handleSave = async () => {
    if (!toolId) {
      // Create new tool
      try {
        setSaving(true);
        const createRes = await api.post('/tools', { tool_type: 'twenty_reasons' });
        const newToolId = createRes.data.tool.id;
        setToolId(newToolId);

        // Save all reasons
        for (const reason of reasons) {
          if (reason.reason_text.trim()) {
            await api.post(`/tools/${newToolId}/reasons`, reason);
          }
        }

        addTool(createRes.data.tool);
        setToast({ message: 'تم حفظ الأسباب', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      } finally {
        setSaving(false);
      }
    } else {
      // Update existing tool
      try {
        setSaving(true);
        for (const reason of reasons) {
          if (reason.reason_text.trim()) {
            await api.post(`/tools/${toolId}/reasons`, reason);
          }
        }
        setToast({ message: 'تم حفظ الأسباب', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleShare = async () => {
    if (!toolId) {
      setToast({ message: 'يجب حفظ الأسباب أولاً', type: 'error' });
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

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center mb-2">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">20 سبب للامتناع</h2>
          <div className="w-8" />
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          اكتب 20 سبب لماذا تريد الامتناع — ستظهر لك يومياً كحافز
        </p>

        {/* Reasons List */}
        <div className="card space-y-3 mb-4">
          {reasons.map((reason) => (
            <div key={reason.reason_number} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                السبب {reason.reason_number}
              </label>
              <textarea
                value={reason.reason_text}
                onChange={(e) => handleReasonChange(reason.reason_number, e.target.value)}
                placeholder={`مثلاً: عشان أكون بجانب أسرتي...`}
                rows={2}
                className="input-base h-auto py-2 resize-none"
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'جاري الحفظ...' : '✓ حفظ'}
          </button>

          <button
            onClick={handleShare}
            disabled={saving || !toolId || shared}
            className={`w-full py-3 px-4 rounded-xl font-medium transition ${
              shared
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {shared ? '✓ مشاركة مع المعالج' : 'مشاركة مع المعالج'}
          </button>

          <button
            onClick={() => navigate('/tools')}
            className="btn-secondary w-full"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
