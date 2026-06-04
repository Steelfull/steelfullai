export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-forest-400 to-forest-600 shadow-[0_8px_20px_-8px_rgba(30,92,68,0.7)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <path
            d="M6 7.5 12 4l6 3.5v9L12 20l-6-3.5v-9Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 4v16M6 7.5l6 3.5 6-3.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-ink-900">
        STEELFULL<span className="text-forest-500">AI</span>
      </span>
    </span>
  );
}
