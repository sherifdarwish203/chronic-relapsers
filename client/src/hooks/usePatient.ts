import { useState, useCallback } from 'react';
import api from '../api/client';

export interface Event {
  id: number;
  period_id: number;
  patient_id: number;
  description: string;
  timeframe: string | null;
  feelings: string[];
  external_triggers: string[];
  internal_triggers: string[];
  classification: 'i' | 'x' | 'b' | null;
  saw_it_coming: 'y' | 'p' | 'n' | null;
  created_at: string;
}

export interface UrgeData {
  triggers: { external: string[]; internal: string[] };
  management: { strategies: string[]; free_text: string | null };
  controlled: 'yes' | 'partial' | 'not_yet' | null;
  help_sought: { reached_out: boolean; who: string | null };
  prevention_activity: { attended: boolean; what: string | null };
  remaining_craving: { still_present: boolean; intensity: number | null };
}

export interface Period {
  id: number;
  patient_id: number;
  type: 'abstinent' | 'relapse' | 'reduced';
  start_month: number;
  start_year: number;
  end_month: number | null;
  end_year: number | null;
  duration_months: number | null;
  note: string | null;
  substances: string[];
  urge_data: UrgeData | null;
  sort_order: number;
  created_at: string;
  events: Event[];
}

export interface Patient {
  id: number;
  code: string;
  display_name: string;
  substances: string[];
  created_at: string;
  updated_at: string;
}

export function usePatient() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/patients/me');
      setPatient(res.data.patient);
      setPeriods(res.data.periods);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'خطأ في تحميل البيانات';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPeriod = (period: Period) => {
    setPeriods((prev) => {
      const updated = [...prev, period];
      return updated.sort(
        (a, b) => (a.start_year * 12 + a.start_month) - (b.start_year * 12 + b.start_month)
      );
    });
  };

  const removePeriod = (periodId: number) => {
    setPeriods((prev) => prev.filter((p) => p.id !== periodId));
  };

  const addEvent = (periodId: number, event: Event) => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, events: [...p.events, event] } : p
      )
    );
  };

  const removeEvent = (periodId: number, eventId: number) => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, events: p.events.filter((e) => e.id !== eventId) } : p
      )
    );
  };

  const updatePeriodUrgeData = useCallback(async (periodId: number, urgeData: UrgeData) => {
    const res = await api.patch(`/periods/${periodId}/urge`, { urge_data: urgeData });
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, urge_data: res.data.period.urge_data } : p
      )
    );
  }, []);

  return {
    patient, setPatient,
    periods, setPeriods,
    loading, error,
    fetchMe,
    addPeriod, removePeriod,
    addEvent, removeEvent,
    updatePeriodUrgeData,
  };
}
