/**
 * Industry quick-select for the chatbot.
 *
 * When a visitor picks their field, we (1) show an instant, industry-specific
 * opener with zero API cost, and (2) pass the industry to /api/chat so Claude
 * tailors every later answer. Openers are localized to the site language.
 */

type Locale = 'en' | 'de' | 'pt';

export type Industry = {
  id: string;
  label: Record<Locale, string>;
  opener: Record<Locale, string>;
};

export const INDUSTRIES: Industry[] = [
  {
    id: 'clinic',
    label: { en: 'Clinic / Health', de: 'Praxis / Gesundheit', pt: 'Clínica / Saúde' },
    opener: {
      en: 'Clinics usually lose the most time on bookings, reminders and after-hours messages. Is that where it hurts — or somewhere else?',
      de: 'Praxen verlieren die meiste Zeit mit Terminbuchungen, Erinnerungen und Nachrichten außerhalb der Sprechzeiten. Ist das Ihr wunder Punkt — oder etwas anderes?',
      pt: 'Clínicas costumam perder mais tempo com agendamentos, lembretes e mensagens fora do horário. É aí que aperta — ou em outro lugar?',
    },
  },
  {
    id: 'real_estate',
    label: { en: 'Real Estate', de: 'Immobilien', pt: 'Imobiliária' },
    opener: {
      en: "For real-estate agencies it's often qualifying and routing leads fast enough before they go cold. Does that sound like your bottleneck?",
      de: 'Bei Immobilienbüros geht es oft darum, Leads schnell genug zu qualifizieren und weiterzuleiten, bevor sie kalt werden. Klingt das nach Ihrem Engpass?',
      pt: 'Em imobiliárias, o desafio costuma ser qualificar e encaminhar leads rápido o bastante antes que esfriem. Esse é o seu gargalo?',
    },
  },
  {
    id: 'law_firm',
    label: { en: 'Law Firm', de: 'Kanzlei', pt: 'Advocacia' },
    opener: {
      en: 'Law firms tend to lose senior time to intake forms, document collection and status updates. Is that your situation?',
      de: 'Kanzleien verlieren oft wertvolle Zeit mit Aufnahmeformularen, Dokumentensammlung und Statusupdates. Trifft das auf Sie zu?',
      pt: 'Escritórios de advocacia costumam gastar tempo valioso com formulários de entrada, coleta de documentos e atualizações de status. É a sua situação?',
    },
  },
  {
    id: 'education',
    label: { en: 'Education', de: 'Bildung', pt: 'Educação' },
    opener: {
      en: 'Schools and educators usually struggle with inquiries scattered across WhatsApp, Instagram and email, and follow-up slipping through. Sound familiar?',
      de: 'Schulen und Bildungsanbieter kämpfen meist mit Anfragen, die über WhatsApp, Instagram und E-Mail verstreut sind, und mit verlorenem Follow-up. Kommt Ihnen das bekannt vor?',
      pt: 'Escolas e educadores costumam sofrer com contatos espalhados entre WhatsApp, Instagram e e-mail, e follow-up que se perde. Soa familiar?',
    },
  },
  {
    id: 'agency',
    label: { en: 'Agency', de: 'Agentur', pt: 'Agência' },
    opener: {
      en: 'Agencies often drown in repetitive client onboarding, reporting and hand-offs between tools. Where does it slow you down most?',
      de: 'Agenturen ertrinken oft in wiederkehrendem Kunden-Onboarding, Reporting und Übergaben zwischen Tools. Wo bremst es Sie am meisten?',
      pt: 'Agências costumam se afogar em onboarding repetitivo de clientes, relatórios e transições entre ferramentas. Onde isso mais te atrasa?',
    },
  },
  {
    id: 'ecommerce',
    label: { en: 'E-commerce / Shop', de: 'E-Commerce / Shop', pt: 'E-commerce / Loja' },
    opener: {
      en: "For shops it's usually customer questions, order updates and data copied between systems. Which of those eats your time?",
      de: 'Bei Shops sind es meist Kundenfragen, Bestellupdates und Daten, die zwischen Systemen kopiert werden. Was davon frisst Ihre Zeit?',
      pt: 'Em lojas, normalmente são dúvidas de clientes, atualizações de pedidos e dados copiados entre sistemas. Qual desses consome o seu tempo?',
    },
  },
];

export function getIndustries(locale: string) {
  const loc: Locale = locale === 'de' || locale === 'pt' ? locale : 'en';
  return INDUSTRIES.map((i) => ({ id: i.id, label: i.label[loc], opener: i.opener[loc] }));
}

export function industryName(id: string): string {
  return INDUSTRIES.find((i) => i.id === id)?.label.en ?? id;
}
