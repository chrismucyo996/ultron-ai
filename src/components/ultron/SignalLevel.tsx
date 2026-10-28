export function SignalLevel({
  active,
  bars = 10,
  className = "h-4",
}: {
  active: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <div className={`lvl flex items-end gap-[3px] ${className}`} data-active={active} aria-hidden>
      {Array.from({ length: bars }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
