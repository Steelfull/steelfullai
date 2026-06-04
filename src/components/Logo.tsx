export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-forest-400 to-forest-600 shadow-[0_8px_20px_-8px_rgba(30,92,68,0.7)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <path d="M7 8 17 12M7 16 17 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7" cy="8" r="2.2" fill="white" />
          <circle cx="7" cy="16" r="2.2" fill="white" />
          <circle cx="17" cy="12" r="2.6" fill="white" />
        </svg>
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-ink-900">
        STEELFULL<span className="text-forest-500">AI</span>
      </span>
    </span>
  );
}
