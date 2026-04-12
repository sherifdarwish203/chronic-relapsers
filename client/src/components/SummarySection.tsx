import { Period } from '../hooks/usePatient';
import { formatDurationAr, formatDateRangeAr } from '../utils/dates';
import { TIMEFRAMES, CLASSIFICATIONS, SAW_IT_COMING } from '../constants/presets';

interface SummarySectionProps {
  periods: Period[];
}

const TYPE_CFG = {
  abstinent: { dot: 'bg-green-500', text: 'text-green-700', label: 'فترة امتناع', noteBorder: 'border-green-400', bg: 'bg-green-50' },
  relapse:   { dot: 'bg-red-500',   text: 'text-red-700',   label: 'انتكاسة',       noteBorder: 'border-red-400',   bg: 'bg-red-50'   },
  reduced:   { dot: 'bg-amber-500', text: 'text-amber-700', label: 'تعاطي منخفض',  noteBorder: 'border-amber-400', bg: 'bg-amber-50' },
};

export default function SummarySection({ periods }: SummarySectionProps) {
  return (
    <div className="relative">
      {periods.map((period, idx) => {
        const cfg = TYPE_CFG[period.type];
        const isLast = idx === periods.length - 1;

        return (
          <div key={period.id} className="flex gap-3 mb-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
              {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
                <span className="text-sm text-gray-600">{formatDurationAr(period.duration_months)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {formatDateRangeAr(period.start_month, period.start_year, period.end_month, period.end_year)}
              </p>

              {period.note && (
                <blockquote className={`mt-1 border-r-4 ${cfg.noteBorder} pr-3 italic text-sm text-gray-700`}>
                  "{period.note}"
                </blockquote>
              )}

              {/* Events sub-cards */}
              {period.events.length > 0 && (
                <div className="mt-2 space-y-2">
                  {period.events.map((event) => (
                    <div key={event.id} className={`${cfg.bg} rounded-lg p-3 text-sm`}>
                      <p className="font-medium text-gray-800 mb-1">{event.description}</p>

                      {event.feelings.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-gray-500 ml-1">المشاعر:</span>
                          {event.feelings.map((f) => (
                            <span key={f} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{f}</span>
                          ))}
                        </div>
                      )}

                      {event.external_triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-gray-500 ml-1">خارجي:</span>
                          {event.external_triggers.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">{t}</span>
                          ))}
                        </div>
                      )}

                      {event.internal_triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-gray-500 ml-1">داخلي:</span>
                          {event.internal_triggers.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{t}</span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {event.classification && `السبب الرئيسي: ${CLASSIFICATIONS[event.classification]}`}
                        {event.saw_it_coming && ` · ${SAW_IT_COMING[event.saw_it_coming]}`}
                        {event.timeframe && ` · ${TIMEFRAMES[event.timeframe]}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
