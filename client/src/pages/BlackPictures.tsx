import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

interface Story {
  story_number: number;
  story_title: string;
  story_text: string;
}

export default function BlackPictures() {
  const navigate = useNavigate();
  const { tools, addTool, updateTool, fetchMe } = usePatient();

  const [stories, setStories] = useState<Story[]>(Array.from({ length: 5 }, (_, i) => ({
    story_number: i + 1,
    story_title: '',
    story_text: '',
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

  // Find existing black_pictures tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'black_pictures');
    if (existingTool) {
      setToolId(existingTool.id);
      setShared(existingTool.shared_with_therapist);
      // Fetch the tool's content
      api.get(`/tools/${existingTool.id}`).then((res) => {
        if (res.data.tool.stories) {
          const storiesMap = new Map<number, { title: string; text: string }>(
            res.data.tool.stories.map((s: any) => [
              s.story_number,
              { title: s.story_title || '', text: s.story_text },
            ])
          );
          setStories(
            Array.from({ length: 5 }, (_, i) => {
              const num = i + 1;
              const existing = storiesMap.get(num);
              return {
                story_number: num,
                story_title: existing?.title || '',
                story_text: existing?.text || '',
              };
            })
          );
        }
      });
    }
  }, [tools]);

  const handleStoryChange = (storyNumber: number, field: 'title' | 'text', value: string) => {
    setStories((prev) =>
      prev.map((s) =>
        s.story_number === storyNumber ? { ...s, [`story_${field}`]: value } : s
      )
    );
  };

  const handleSave = async () => {
    if (!toolId) {
      // Create new tool
      try {
        setSaving(true);
        const createRes = await api.post('/tools', { tool_type: 'black_pictures' });
        const newToolId = createRes.data.tool.id;
        setToolId(newToolId);

        // Save all stories
        for (const story of stories) {
          if (story.story_text.trim()) {
            await api.post(`/tools/${newToolId}/stories`, story);
          }
        }

        addTool(createRes.data.tool);
        setToast({ message: 'تم حفظ القصص', type: 'success' });
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
        for (const story of stories) {
          if (story.story_text.trim()) {
            await api.post(`/tools/${toolId}/stories`, story);
          }
        }
        setToast({ message: 'تم حفظ القصص', type: 'success' });
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
      setToast({ message: 'يجب حفظ القصص أولاً', type: 'error' });
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
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">الصور السوداء</h2>
          <div className="w-8" />
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          اكتب 5 قصص عن أوقات صعبة وصلت فيها للقاع — اقرأها عندما تشعر برغبة في الانتكاسة
        </p>

        {/* Stories List */}
        <div className="card space-y-6 mb-4">
          {stories.map((story) => (
            <div key={story.story_number} className="pb-4 border-b last:border-b-0 last:pb-0">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                الموقف {story.story_number}
              </label>

              <input
                type="text"
                value={story.story_title}
                onChange={(e) => handleStoryChange(story.story_number, 'title', e.target.value)}
                placeholder="عنوان الموقف (اختياري)"
                className="input-base mb-2 text-sm"
              />

              <textarea
                value={story.story_text}
                onChange={(e) => handleStoryChange(story.story_number, 'text', e.target.value)}
                placeholder="اكتب القصة بالتفصيل — ماذا حدث، كيف شعرت، ماذا تعلمت..."
                rows={4}
                className="input-base h-auto py-2 resize-none text-sm"
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
