interface TriggerTagsProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorScheme?: 'green' | 'amber' | 'blue' | 'red';
}

export default function TriggerTags({
  options,
  selected,
  onChange,
  colorScheme = 'green',
}: TriggerTagsProps) {
  const selectedClass =
    colorScheme === 'green' ? 'pill-selected-green' :
    colorScheme === 'amber' ? 'pill-selected-amber' :
    colorScheme === 'red'   ? 'pill-selected-red' :
    'pill-selected-blue';

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => toggle(item)}
          className={`pill ${selected.includes(item) ? selectedClass : 'pill-default'}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
