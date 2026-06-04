import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('nav');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-forest-500">404</p>
      <h1 className="mt-6 text-4xl font-semibold text-ink-900 sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-ink-500">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center rounded-full bg-forest-500 px-6 py-3 text-sm font-semibold text-canvas-soft transition hover:bg-forest-600"
      >
        {t('bookCall')}
      </Link>
    </div>
  );
}
