interface StepDotsProps {
  total: number;
  current: number; // 1-based
}

export default function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 my-4">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const filled = step <= current;
        return (
          <div
            key={step}
            className={`w-3 h-3 rounded-full transition-all ${
              filled ? 'bg-primary scale-110' : 'bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}
