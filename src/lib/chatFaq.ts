/**
 * Hybrid chatbot layer.
 *
 * Predictable, common questions are answered instantly from this on-brand
 * library — no API call, no token cost. Anything that doesn't match here
 * falls through to Claude in /api/chat. Keep answers short and accurate.
 *
 * Matching is accent-insensitive and case-insensitive, and keywords from all
 * three languages are pooled per intent (harmless and improves recall). The
 * ANSWER returned is localized to the visitor's site language.
 */

type Locale = 'en' | 'de' | 'pt';

type Intent = {
  id: string;
  keywords: string[];
  answers: Record<Locale, string>;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .trim();
}

// Ordered most-specific → least-specific. First match wins.
const INTENTS: Intent[] = [
  {
    id: 'pricing',
    keywords: [
      'how much', 'cost', 'price', 'pricing', 'expensive', 'budget', 'quote',
      'kosten', 'preis', 'preise', 'teuer', 'angebot',
      'quanto custa', 'custo', 'custa', 'preco', 'valor', 'orcamento',
    ],
    answers: {
      en: "Every project is priced to the outcome it delivers, so there's no fixed tag. After a short call I'll give you a clear, fixed proposal — and most automations pay for themselves in saved time within months. What would you want to automate?",
      de: 'Jedes Projekt wird nach dem Ergebnis bemessen — es gibt also keinen Festpreis. Nach einem kurzen Gespräch erhalten Sie von mir ein klares Festangebot, und die meisten Automatisierungen amortisieren sich innerhalb weniger Monate. Was möchten Sie automatisieren?',
      pt: 'Cada projeto é dimensionado pelo resultado que entrega, então não há um preço fixo. Após uma conversa rápida, eu te passo uma proposta clara e fechada — e a maioria das automações se paga em poucos meses. O que você gostaria de automatizar?',
    },
  },
  {
    id: 'timeline',
    keywords: [
      'how long', 'timeline', 'time frame', 'timeframe', 'duration', 'how fast', 'when will',
      'wie lange', 'dauer', 'zeitrahmen', 'wie schnell',
      'quanto tempo', 'prazo', 'demora', 'quando fica',
    ],
    answers: {
      en: "Focused automations often go live in a few weeks; broader system integrations take longer. After a quick audit you'll have a realistic timeline before any work starts.",
      de: 'Gezielte Automatisierungen gehen oft in wenigen Wochen live; größere Systemintegrationen dauern länger. Nach einem kurzen Audit erhalten Sie einen realistischen Zeitplan, bevor die Arbeit beginnt.',
      pt: 'Automações pontuais costumam entrar no ar em poucas semanas; integrações maiores levam mais tempo. Após uma auditoria rápida, você terá um prazo realista antes de qualquer trabalho começar.',
    },
  },
  {
    id: 'integration',
    keywords: [
      'existing software', 'current software', 'integrate', 'integration', 'my tools',
      'work with my', 'compatible', 'connect',
      'bestehende', 'vorhandene', 'integrieren', 'meine tools', 'kompatibel', 'verbinden',
      'integrar', 'integracao', 'minhas ferramentas', 'compativel', 'conectar',
    ],
    answers: {
      en: 'In most cases, yes — I build around the tools you already use (CRM, spreadsheets, calendars, messaging) rather than replacing them. Connecting disconnected systems is a core part of what I do. Which tools are you using?',
      de: 'In den meisten Fällen ja — ich baue um die Tools herum, die Sie bereits nutzen (CRM, Tabellen, Kalender, Messaging), statt sie zu ersetzen. Das Verbinden getrennter Systeme ist ein Kernstück meiner Arbeit. Welche Tools nutzen Sie?',
      pt: 'Na maioria dos casos, sim — eu construo em torno das ferramentas que você já usa (CRM, planilhas, agendas, mensagens), em vez de substituí-las. Conectar sistemas desconectados é parte central do meu trabalho. Quais ferramentas você usa?',
    },
  },
  {
    id: 'technical',
    keywords: [
      'technical knowledge', 'do i need to know', 'non-technical', 'need to code', 'understand tech',
      'technische', 'technikkenntnisse', 'muss ich programmieren', 'technisches wissen',
      'conhecimento tecnico', 'preciso saber', 'precisa programar', 'nao sou tecnico',
    ],
    answers: {
      en: 'None at all. You bring the deep knowledge of your business; I handle every technical decision and explain things in plain language as you go.',
      de: 'Überhaupt keine. Sie bringen das tiefe Wissen über Ihr Geschäft mit; ich übernehme jede technische Entscheidung und erkläre alles in klarer Sprache.',
      pt: 'Nenhum. Você traz o conhecimento profundo do seu negócio; eu cuido de cada decisão técnica e explico tudo em linguagem simples.',
    },
  },
  {
    id: 'languages',
    keywords: [
      'language', 'languages', 'international', 'work remotely', 'time zone', 'do you speak',
      'sprache', 'sprachen', 'international', 'zeitzone', 'sprechen sie',
      'idioma', 'idiomas', 'internacional', 'fuso', 'voce fala',
    ],
    answers: {
      en: 'Yes — I work remotely with clients across time zones and deliver in German, English and Portuguese.',
      de: 'Ja — ich arbeite remote mit Kunden über Zeitzonen hinweg und liefere auf Deutsch, Englisch und Portugiesisch.',
      pt: 'Sim — eu trabalho remotamente com clientes em diferentes fusos e entrego em alemão, inglês e português.',
    },
  },
  {
    id: 'services',
    keywords: [
      'what do you do', 'what can you', 'what can he', 'services', 'what do you offer',
      'what do you automate', 'can you automate',
      'was machen sie', 'was konnen sie', 'leistungen', 'was bietet', 'was automatisieren',
      'o que voce faz', 'o que pode', 'servicos', 'o que oferece', 'o que automatiza',
    ],
    answers: {
      en: "I eliminate repetitive work and connect systems — customer-inquiry automation (WhatsApp/email/forms), CRM and calendar integrations, document and intake workflows, and custom internal tools, often built with AI. What's eating most of your time right now?",
      de: 'Ich beseitige repetitive Arbeit und verbinde Systeme — Automatisierung von Kundenanfragen (WhatsApp/E-Mail/Formulare), CRM- und Kalender-Integrationen, Dokumenten- und Intake-Workflows sowie individuelle interne Tools, oft mit KI. Was frisst gerade die meiste Zeit?',
      pt: 'Eu elimino trabalho repetitivo e conecto sistemas — automação de contatos de clientes (WhatsApp/e-mail/formulários), integrações de CRM e agenda, fluxos de documentos e cadastro, e ferramentas internas sob medida, muitas vezes com IA. O que mais consome o seu tempo hoje?',
    },
  },
  {
    id: 'about',
    keywords: [
      'who are you', 'who is tim', 'about tim', 'your background', 'who am i talking',
      'wer ist tim', 'wer sind sie', 'uber tim', 'hintergrund',
      'quem e tim', 'quem e voce', 'sobre tim', 'experiencia do tim',
    ],
    answers: {
      en: "I'm a German software developer and automation specialist working from Rio — I've built a module-handbook web app for the University of Applied Sciences Flensburg, CE machine-safety software for an engineering firm, and my own AI education product, educAItion. Anything you'd like to automate?",
      de: 'Ich bin ein deutscher Softwareentwickler und Automatisierungsspezialist in Rio — ich habe eine Modulhandbuch-Web-App für die Hochschule Flensburg gebaut, CE-Maschinensicherheits-Software für ein Ingenieurbüro und mein eigenes KI-Bildungsprodukt educAItion. Was möchten Sie automatisieren?',
      pt: 'Sou um desenvolvedor de software e especialista em automação alemão que trabalha do Rio — construí um app web de manuais de módulos para a University of Applied Sciences Flensburg, software CE de segurança de máquinas para uma empresa de engenharia, e meu próprio produto de IA para educação, o educAItion. O que você gostaria de automatizar?',
    },
  },
  {
    id: 'start',
    keywords: [
      'how do we start', 'get started', 'how to start', 'next step', 'book a call', 'book a strategy',
      'schedule', 'how do i contact', 'reach you',
      'wie fangen wir', 'loslegen', 'nachster schritt', 'termin buchen', 'wie erreiche',
      'como comecamos', 'como comecar', 'proximo passo', 'agendar', 'como falo',
    ],
    answers: {
      en: "Easy — tap 'Send chat to Tim' to send me this conversation, or book a free strategy call below. Either way I reply within 24 hours.",
      de: 'Ganz einfach — tippen Sie auf „Chat an Tim senden", um mir dieses Gespräch zu schicken, oder buchen Sie unten ein kostenloses Strategiegespräch. So oder so antworte ich innerhalb von 24 Stunden.',
      pt: "Fácil — toque em 'Enviar conversa ao Tim' para me enviar esta conversa, ou agende uma conversa de estratégia gratuita abaixo. De qualquer forma, respondo em até 24 horas.",
    },
  },
];

export function matchCannedAnswer(message: string, locale: string): string | null {
  const text = normalize(message);
  if (text.length < 2) return null;
  const loc: Locale = locale === 'de' || locale === 'pt' ? locale : 'en';

  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (text.includes(normalize(kw))) {
        return intent.answers[loc];
      }
    }
  }
  return null;
}
