import { useNavigate } from 'react-router-dom';
import { Period } from '../hooks/usePatient';
import { formatDurationAr, formatDateRangeAr } from '../utils/dates';
import { CONTROLLED_OPTIONS } from '../constants/presets';

interface PeriodCardProps {
  period: Period;
  onDelete: (id: number) => void;
}

const TYPE_CONFIG = {
  abstinent: {
    label: 'فترة امتناع',
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#86EFAC]',
    text: 'text-green-700',
    dot: 'bg-green-500',
    noteBorder: 'border-green-400',
  },
  relapse: {
    label: 'انتكاسة',
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#FCA5A5]',
    text: 'text-red-700',
    dot: 'bg-red-500',
    noteBorder: 'border-red-400',
  },
  reduced: {
    label: 'فكرة ضرب',
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FCD34D]',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    noteBorder: 'border-amber-400',
  },
};

export default function PeriodCard({ period, onDelete }: PeriodCardProps) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[period.type];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-4`}>
      {/* Row 1: type + duration */}
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
        <span className="text-sm text-gray-600">{formatDurationAr(period.duration_months)}</span>
      </div>

      {/* Row 2: date range */}
      <p className="text-xs text-gray-500 mb-2">
        {formatDateRangeAr(period.start_month, period.start_year, period.end_month, period.end_year)}
      </p>

      {/* Row 3: note */}
      {period.note && (
        <blockquote className={`border-r-4 ${cfg.noteBorder} pr-3 italic text-sm text-gray-700 mb-2`}>
          "{period.note}"
        </blockquote>
      )}

      {/* Row 4: substances (relapse only) */}
      {period.type === 'relapse' && period.substances?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {period.substances.map((s) => (
            <span key={s} className="px-2 py-0.5 text-xs rounded-full border border-amber-300 bg-amber-50 text-amber-800">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Row 5: event badge (relapses only) */}
      {period.type === 'relapse' && (
        <div className="mb-3">
          {period.events.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
              ✓ {period.events.length} أحداث مسجلة
            </span>
          ) : (
            <span className="text-xs text-gray-400">لم تُسجَّل الأحداث بعد</span>
          )}
        </div>
      )}

      {/* Row 5b: urge badge (reduced only) */}
      {period.type === 'reduced' && (
        <div className="mb-3">
          {period.urge_data ? (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                ✓ تم تقييم الرغبة
              </span>
              {period.urge_data.controlled && (
                <span className="text-xs text-gray-500">{CONTROLLED_OPTIONS[period.urge_data.controlled]}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">لم يُسجَّل تقييم الرغبة</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-row-reverse">
        <button
          onClick={() => onDelete(period.id)}
          className="btn-danger text-xs"
        >
          حذف
        </button>
        {period.type === 'relapse' && (
          <button
            onClick={() => navigate(`/timeline/events/${period.id}`)}
            className="btn-secondary text-xs"
          >
            أحداث
          </button>
        )}
        {period.type === 'reduced' && (
          <button
            onClick={() => navigate(`/timeline/urge/${period.id}`)}
            className="btn-secondary text-xs"
          >
            {period.urge_data ? 'تعديل التقييم' : 'تقييم الرغبة'}
          </button>
        )}
      </div>
    </div>
  );
}
