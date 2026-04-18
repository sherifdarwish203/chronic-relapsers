interface FreqItem {
  name: string;
  count: number;
}

interface AggregateChartProps {
  items: FreqItem[];
  colorClass?: string;
}

export default function AggregateChart({
  items,
  colorClass = 'bg-green-500',
}: AggregateChartProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400">لا توجد بيانات</p>;
  }

  const max = items[0]?.count || 1;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="text-sm text-gray-700 w-32 sm:w-40 truncate text-right flex-shrink-0">
            {item.name}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full ${colorClass} transition-all`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-6 text-center flex-shrink-0">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
