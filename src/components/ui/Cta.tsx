'use client';

import { Calendar, MessageCircle, Mail, ArrowUpRight } from 'lucide-react';
import { contact } from '@/config/contact';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-forest-500/50 disabled:opacity-50';

const sizes = {
  md: 'px-5 py-2.5',
  lg: 'px-7 py-3.5 text-[0.95rem]',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-forest-500 text-canvas-soft shadow-[0_10px_30px_-12px_rgba(30,92,68,0.6)] hover:bg-forest-600',
  secondary:
    'border border-ink-900/15 bg-canvas-raised text-ink-900 hover:border-forest-500/40 hover:bg-forest-50',
  ghost: 'text-ink-500 hover:text-ink-900',
};

type CtaLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  icon?: ReactNode;
  external?: boolean;
  className?: string;
  withArrow?: boolean;
};

export function CtaLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  external = true,
  className = '',
  withArrow = false,
}: CtaLinkProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      <span>{children}</span>
      {withArrow && (
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </a>
  );
}

/* Channel-specific shortcuts that pull from the central contact config. */

export function BookCallButton({
  label,
  variant = 'primary',
  size = 'md',
  className,
}: {
  label: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <CtaLink
      href={contact.calendlyUrl}
      variant={variant}
      size={size}
      className={className}
      icon={<Calendar className="h-4 w-4" />}
    >
      {label}
    </CtaLink>
  );
}

export function WhatsAppButton({
  label,
  variant = 'secondary',
  size = 'md',
  className,
}: {
  label: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <CtaLink
      href={contact.whatsappUrl}
      variant={variant}
      size={size}
      className={className}
      icon={<MessageCircle className="h-4 w-4" />}
    >
      {label}
    </CtaLink>
  );
}

export function EmailButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
}: {
  label: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <CtaLink
      href={contact.emailUrl}
      external={false}
      variant={variant}
      size={size}
      className={className}
      icon={<Mail className="h-4 w-4" />}
    >
      {label}
    </CtaLink>
  );
}
