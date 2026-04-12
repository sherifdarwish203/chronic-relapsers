import { Event } from '../hooks/usePatient';
import { TIMEFRAMES, CLASSIFICATIONS, SAW_IT_COMING } from '../constants/presets';

interface EventCardProps {
  event: Event;
  onDelete: (id: number) => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
  const preview = event.description.length > 60
    ? event.description.slice(0, 60) + '...'
    : event.description;

  return (
    <div className="flex items-start justify-between gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{preview}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {event.classification && CLASSIFICATIONS[event.classification]}
          {event.feelings.length > 0 && ` · ${event.feelings.slice(0, 2).join('، ')}`}
          {event.timeframe && ` · ${TIMEFRAMES[event.timeframe]}`}
        </p>
        {event.saw_it_coming && (
          <p className="text-xs text-gray-400">
            توقّعها: {SAW_IT_COMING[event.saw_it_coming]}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(event.id)}
        className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0 pt-0.5"
        title="حذف الحدث"
      >
        ×
      </button>
    </div>
  );
}
