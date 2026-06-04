import { getTranslations } from 'next-intl/server';
import { contact } from '@/config/contact';

const SITE_URL = 'https://steelfullai.com';

export async function StructuredData({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'meta' });

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'SteelfullAI',
    url: SITE_URL,
    description: t('description'),
    email: contact.emailAddress,
    areaServed: 'Worldwide',
    knowsLanguage: ['pt', 'en', 'de'],
    founder: {
      '@type': 'Person',
      name: 'Tim-Luka Stahl',
      jobTitle: 'Business Automation Specialist',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rio de Janeiro',
      addressCountry: 'BR',
    },
    sameAs: [contact.social.linkedin, contact.social.github, contact.social.instagram],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
