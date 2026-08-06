export function SegmentControl<T extends string>({
  value,
  options,
  labels,
  onChange,
  className = '',
  'aria-label': ariaLabel,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={`mio-segment ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={`mio-segment__option fi ${active ? 'mio-segment__option--active' : ''}`}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}
