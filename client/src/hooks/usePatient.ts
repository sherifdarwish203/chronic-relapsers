import { useState, useCallback } from 'react';
import api from '../api/client';

export interface Activity {
  id: number;
  patient_id: number;
  act_day: number | null;
  act_month: number;
  act_year: number;
  type: 'individual' | 'group' | 'community';
  therapist: string | null;
  summary: string | null;
  created_at: string;
}

export interface Tool {
  id: number;
  patient_id: number;
  tool_type: 'twenty_reasons' | 'black_pictures' | 'daily_planner' | 'safety_map' | 'personal_triangle' | 'program_principles' | 'personality_problems' | 'decision_matrix';
  created_at: string;
  updated_at: string;
  shared_with_therapist: boolean;
  shared_at: string | null;
}

export interface SafeMapTrigger {
  id: number;
  tool_id: number;
  category: 'people' | 'places' | 'situations' | 'habits' | 'instruments' | 'emotions' | 'thoughts';
  trigger_name: string;
  trigger_description: string | null;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  notes: string | null;
  category_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TwentyReason {
  id: number;
  tool_id: number;
  reason_number: number;
  reason_text: string;
  created_at: string;
  updated_at: string;
}

export interface BlackPicture {
  id: number;
  tool_id: number;
  story_number: number;
  story_title: string | null;
  story_text: string;
  created_at: string;
  updated_at: string;
}

export interface DailyPlannerActivity {
  id: number;
  tool_id: number;
  plan_date: string;
  hour: number;
  activity_description: string | null;
  risk_level: 'low' | 'high';
  location: string | null;
  with_whom: string | null;
  exact_time: string | null;
  safety_plan: string | null;
  created_at: string;
  updated_at: string;
}

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
  date: { day: number; month: number; year: number } | null;
  triggers: { external: string[]; ext_other: string | null; internal: string[]; int_other: string | null };
  management: { strategies: string[]; free_text: string | null };
  controlled: 'yes' | 'partial' | 'not_yet' | 'relapsed' | null;
  help_sought: { reached_out: boolean; who: string | null };
  prevention_activity: { attended: boolean; what: string | null };
  remaining_craving: { still_present: boolean; intensity: number | null };
}

export interface Period {
  id: number;
  patient_id: number;
  type: 'abstinent' | 'relapse' | 'reduced';
  start_day: number | null;
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

export interface PersonalTriangleMessage {
  id: number;
  tool_id: number;
  from_persona: 'victim' | 'abuser' | 'bystander';
  to_persona: 'victim' | 'abuser' | 'bystander';
  message_text: string;
  position_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface AbusserThoughtJournalEntry {
  id: number;
  tool_id: number;
  journal_date: string;
  abuser_thought: string;
  intensity: number;
  victim_response: string | null;
  bystander_analysis: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrincipleExample {
  id: number;
  principle_id: number;
  example_text: string;
  example_date: string;
  created_at: string;
  updated_at?: string;
}

export interface ProgramPrinciple {
  id: number;
  tool_id: number;
  principle_name: string;
  principle_description: string;
  examples: PrincipleExample[];
  created_at: string;
  updated_at: string;
}

export interface PersonalityProblemExample {
  id: number;
  problem_id: number;
  example_text: string;
  example_date: string;
  created_at: string;
  updated_at?: string;
}

export interface PersonalityProblem {
  id: number;
  tool_id: number;
  problem_name: string;
  problem_description: string;
  examples: PersonalityProblemExample[];
  created_at: string;
  updated_at: string;
}

export interface DecisionMatrixItem {
  id: number;
  tool_id: number;
  category: 'pros_using' | 'cons_using' | 'pros_abstinent' | 'cons_abstinent';
  item_text: string;
  position_order: number | null;
  created_at: string;
  updated_at: string;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/patients/me');
      setPatient(res.data.patient);
      setPeriods(res.data.periods);
      setActivities(res.data.activities || []);

      // Fetch tools separately
      try {
        const toolsRes = await api.get('/tools');
        setTools(toolsRes.data.tools || []);
      } catch {
        // Tools might not exist yet — that's okay
        setTools([]);
      }
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

  const addActivity = (activity: Activity) => {
    setActivities((prev) =>
      [activity, ...prev].sort(
        (a, b) => (b.act_year * 12 + b.act_month) - (a.act_year * 12 + a.act_month)
      )
    );
  };

  const removeActivity = (activityId: number) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  };

  const addTool = (tool: Tool) => {
    setTools((prev) => [tool, ...prev]);
  };

  const updateTool = (toolId: number, updates: Partial<Tool>) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, ...updates } : t))
    );
  };

  const removeTool = (toolId: number) => {
    setTools((prev) => prev.filter((t) => t.id !== toolId));
  };

  return {
    patient, setPatient,
    periods, setPeriods,
    activities,
    tools,
    loading, error,
    fetchMe,
    addPeriod, removePeriod,
    addEvent, removeEvent,
    updatePeriodUrgeData,
    addActivity, removeActivity,
    addTool, updateTool, removeTool,
  };
}
