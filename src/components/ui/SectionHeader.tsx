import { Reveal } from './Reveal';

export function SectionHeader({
  label,
  title,
  subtitle,
  align = 'left',
  className = '',
}: {
  label: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start';
  return (
    <div className={`flex max-w-2xl flex-col gap-5 ${alignment} ${className}`}>
      <Reveal>
        <span className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {label}
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="heading-lg">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="body-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
