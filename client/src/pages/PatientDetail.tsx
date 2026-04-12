import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import SummarySection from '../components/SummarySection';
import { formatDurationAr } from '../utils/dates';
import { Period, Patient } from '../hooks/usePatient';

interface Analytics {
  event_count: number;
  classification_counts: { i: number; x: number; b: number };
  top_feelings: { name: string; count: number }[];
  top_external_triggers: { name: string; count: number }[];
  top_internal_triggers: { name: string; count: number }[];
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    api.get(`/facilitators/patients/${id}`)
      .then((res) => {
        setPatient(res.data.patient);
        setPeriods(res.data.periods);
        setAnalytics(res.data.analytics);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrintPDF = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('facilitator_token');
      const res = await fetch(`/api/v1/facilitators/patients/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `patient_${id}_summary.pdf`;
      a.click();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const abstinenceCount = periods.filter((p) => p.type === 'abstinent').length;
  const relapseCount = periods.filter((p) => p.type === 'relapse').length;
  const longestAbstinence = periods
    .filter((p) => p.type === 'abstinent')
    .reduce((max, p) => Math.max(max, p.duration_months || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400" dir="ltr" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="ltr" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm border border-gray-200 rounded px-2 py-1"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{patient?.display_name}</h1>
              <p className="text-sm text-gray-500">Code: {patient?.code}</p>
            </div>
          </div>
          <button
            onClick={handlePrintPDF}
            disabled={downloadingPdf}
            className="bg-green-700 text-white text-sm rounded-lg px-4 py-2 hover:bg-green-800 disabled:opacity-50"
          >
            {downloadingPdf ? 'Generating...' : 'Print PDF'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{abstinenceCount}</p>
            <p className="text-xs text-gray-500 mt-1">فترات امتناع</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{relapseCount}</p>
            <p className="text-xs text-gray-500 mt-1">انتكاسات</p>
          </div>
          {longestAbstinence > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-green-700">{formatDurationAr(longestAbstinence)}</p>
              <p className="text-xs text-gray-500 mt-1">أطول امتناع</p>
            </div>
          )}
          {analytics && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{analytics.event_count}</p>
              <p className="text-xs text-gray-500 mt-1">Events Recorded</p>
            </div>
          )}
        </div>

        {/* Timeline — Arabic + English headers */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-1">Timeline / الجدول الزمني</h2>
          <SummarySection periods={periods} />
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">Trigger Analysis / تحليل المحفزات</h2>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="font-bold text-blue-700">{analytics.classification_counts.i}</p>
                <p className="text-xs">Internal / داخلي</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="font-bold text-amber-700">{analytics.classification_counts.x}</p>
                <p className="text-xs">External / خارجي</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="font-bold text-green-700">{analytics.classification_counts.b}</p>
                <p className="text-xs">Both / الاثنان</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.top_feelings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Top Feelings</p>
                  {analytics.top_feelings.map((f) => (
                    <p key={f.name} className="text-sm">{f.name} <span className="text-gray-400">({f.count})</span></p>
                  ))}
                </div>
              )}
              {analytics.top_external_triggers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">External Triggers</p>
                  {analytics.top_external_triggers.map((t) => (
                    <p key={t.name} className="text-sm">{t.name} <span className="text-gray-400">({t.count})</span></p>
                  ))}
                </div>
              )}
              {analytics.top_internal_triggers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Internal Triggers</p>
                  {analytics.top_internal_triggers.map((t) => (
                    <p key={t.name} className="text-sm">{t.name} <span className="text-gray-400">({t.count})</span></p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Substances */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Substances / المواد</h2>
          <div className="flex flex-wrap gap-2">
            {(patient?.substances || []).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-sm">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
