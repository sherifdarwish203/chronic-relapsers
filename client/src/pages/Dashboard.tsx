import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useFacilitatorAuth } from '../hooks/useAuth';
import AggregateChart from '../components/AggregateChart';
import { SUBSTANCES } from '../constants/presets';

interface PatientRow {
  id: number; code: string; display_name: string; substances: string[];
  period_count: number; relapse_count: number; abstinence_count: number;
  longest_abstinence_months: number | null; event_count: number; last_updated: string;
}

interface AggregateData {
  total_patients: number; total_relapses: number; total_events: number;
  internal_pct: number; external_pct: number; both_pct: number;
  top_feelings: { name: string; count: number }[];
  top_external_triggers: { name: string; count: number }[];
  top_internal_triggers: { name: string; count: number }[];
  saw_it_coming: { y: number; p: number; n: number };
}

type SortKey = 'code' | 'relapse_count' | 'event_count' | 'last_updated';

interface EditTarget { id: number; display_name: string; substances: string[] }

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useFacilitatorAuth();

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('last_updated');
  const [facilitator, setFacilitator] = useState<{ full_name?: string } | null>(null);

  // New patient form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState<{ code: string; display_name: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubstances, setEditSubstances] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/facilitators/patients'),
        api.get('/facilitators/aggregate'),
      ]);
      setPatients(pRes.data.patients);
      setAggregate(aRes.data);
    } catch {
      // redirected by interceptor on 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('facilitator_data');
    if (data) setFacilitator(JSON.parse(data));
    fetchData();
  }, [fetchData]);

  const handleSignOut = () => { logout(); navigate('/dashboard/login'); };

  const handleCreatePatient = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/facilitators/patients', { display_name: newName.trim() });
      setNewCode({ code: res.data.patient.code, display_name: res.data.patient.display_name });
      setNewName('');
      setShowNewForm(false);
      fetchData();
    } catch {
      alert('Failed to create patient. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (p: PatientRow) => {
    setEditTarget({ id: p.id, display_name: p.display_name, substances: p.substances || [] });
    setEditName(p.display_name);
    setEditSubstances(p.substances || []);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/facilitators/patients/${editTarget.id}`, {
        display_name: editName.trim(),
        substances: editSubstances,
      });
      setPatients((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? { ...p, display_name: editName.trim(), substances: editSubstances }
            : p
        )
      );
      setEditTarget(null);
    } catch {
      alert('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditSubstance = (s: string) => {
    setEditSubstances((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleCSVExport = () => {
    const token = localStorage.getItem('facilitator_token');
    fetch('/api/v1/facilitators/export/csv', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'recovery_research_export.csv';
        a.click();
      });
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortKey === 'code') return a.code.localeCompare(b.code);
    if (sortKey === 'relapse_count') return b.relapse_count - a.relapse_count;
    if (sortKey === 'event_count') return b.event_count - a.event_count;
    return new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="ltr" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Recovery Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{facilitator?.full_name || 'Facilitator'}</span>
            <button
              onClick={() => { setShowNewForm((v) => !v); setNewCode(null); }}
              className="text-sm text-white bg-green-700 hover:bg-green-800 rounded px-3 py-1"
            >
              + New Patient
            </button>
            <button onClick={fetchData} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1">
              Refresh
            </button>
            <button onClick={handleSignOut} className="text-sm text-red-600 hover:text-red-700 border border-red-200 rounded px-2 py-1">
              Sign Out
            </button>
          </div>
        </div>

        {/* New patient form */}
        {showNewForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <h3 className="font-medium text-gray-800 mb-3">New Patient</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePatient()}
                placeholder="Patient name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-600"
                autoFocus
              />
              <button
                onClick={handleCreatePatient}
                disabled={!newName.trim() || creating}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm rounded-lg px-4 py-2"
              >
                {creating ? '...' : 'Generate Code'}
              </button>
              <button
                onClick={() => { setShowNewForm(false); setNewName(''); }}
                className="text-gray-400 hover:text-gray-600 text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Generated code banner */}
        {newCode && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-5 mb-5 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Code generated for <strong>{newCode.display_name}</strong></p>
              <p className="text-3xl font-mono font-bold text-green-900 tracking-widest">{newCode.code}</p>
              <p className="text-xs text-green-700 mt-2">Give this code to the patient. They enter it with their first name to access their record.</p>
            </div>
            <button onClick={() => setNewCode(null)} className="text-green-600 hover:text-green-800 text-xl font-bold ml-4 leading-none">×</button>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading...</div>
        ) : (
          <>
            {/* Metric cards */}
            {aggregate && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Patients', value: aggregate.total_patients },
                  { label: 'Total Relapses', value: aggregate.total_relapses },
                  { label: 'Events Recorded', value: aggregate.total_events },
                  { label: '% Internal Triggers', value: `${aggregate.internal_pct}%` },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Trigger chart */}
            {aggregate && aggregate.top_feelings.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <h2 className="font-semibold text-gray-700 mb-3">Most Common Triggers — All Patients</h2>
                <AggregateChart items={aggregate.top_feelings} colorClass="bg-blue-500" />
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-2">Top External Triggers</p>
                    {aggregate.top_external_triggers.slice(0, 3).map((t) => (
                      <p key={t.name} className="text-sm text-gray-700">{t.name} <span className="text-gray-400">({t.count})</span></p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-2">Top Internal Triggers</p>
                    {aggregate.top_internal_triggers.slice(0, 3).map((t) => (
                      <p key={t.name} className="text-sm text-gray-700">{t.name} <span className="text-gray-400">({t.count})</span></p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Saw it coming */}
            {aggregate && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <h2 className="font-semibold text-gray-700 mb-2">Anticipation Breakdown</h2>
                <p className="text-sm text-gray-600">
                  Anticipated: <strong>{aggregate.saw_it_coming.y}</strong> &nbsp;|&nbsp;
                  Partly: <strong>{aggregate.saw_it_coming.p}</strong> &nbsp;|&nbsp;
                  Unexpected: <strong>{aggregate.saw_it_coming.n}</strong>
                </p>
              </div>
            )}

            {/* Export */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-2">Export Research Data</h2>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Anonymised by patient code — no names in export</p>
                <button onClick={handleCSVExport} className="bg-green-700 text-white text-sm rounded-lg px-4 py-2 hover:bg-green-800">
                  Export CSV
                </button>
              </div>
            </div>

            {/* Patient list */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Patients ({patients.length})</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  Sort:
                  {(['code', 'relapse_count', 'event_count', 'last_updated'] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={`px-2 py-0.5 rounded border transition ${sortKey === k ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-200'}`}
                    >
                      {k.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Code</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Substance(s)</th>
                      <th className="pb-2 font-medium text-center">Periods</th>
                      <th className="pb-2 font-medium text-center">Relapses</th>
                      <th className="pb-2 font-medium text-center">Events</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPatients.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 font-mono">{p.code}</td>
                        <td className="py-2">{p.display_name}</td>
                        <td className="py-2 text-gray-600 text-xs">{(p.substances || []).join(', ')}</td>
                        <td className="py-2 text-center">{p.period_count}</td>
                        <td className="py-2 text-center text-red-600">{p.relapse_count}</td>
                        <td className="py-2 text-center">{p.event_count}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded px-2 py-0.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/patients/${p.id}`)}
                              className="text-xs text-green-700 hover:text-green-800 border border-green-200 rounded px-2 py-0.5"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Edit Patient</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-600"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Substances</label>
              <div className="flex flex-wrap gap-2" dir="rtl">
                {SUBSTANCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleEditSubstance(s)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      editSubstances.includes(s)
                        ? 'bg-green-100 border-green-600 text-green-800 font-medium'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || saving}
                className="text-sm bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-lg px-4 py-2"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
