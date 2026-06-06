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
      en: "Every project is priced to the outcome it delivers, so there's no fixed tag. After a short call Tim gives you a clear, fixed proposal — and most automations pay for themselves in saved time within months. What would you want to automate?",
      de: 'Jedes Projekt wird nach dem Ergebnis bemessen — es gibt also keinen Festpreis. Nach einem kurzen Gespräch erhalten Sie von Tim ein klares Festangebot, und die meisten Automatisierungen amortisieren sich innerhalb weniger Monate. Was möchten Sie automatisieren?',
      pt: 'Cada projeto é dimensionado pelo resultado que entrega, então não há um preço fixo. Após uma conversa rápida, o Tim te passa uma proposta clara e fechada — e a maioria das automações se paga em poucos meses. O que você gostaria de automatizar?',
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
      en: 'In most cases, yes — Tim builds around the tools you already use (CRM, spreadsheets, calendars, messaging) rather than replacing them. Connecting disconnected systems is a core part of the work. Which tools are you using?',
      de: 'In den meisten Fällen ja — Tim baut um die Tools herum, die Sie bereits nutzen (CRM, Tabellen, Kalender, Messaging), statt sie zu ersetzen. Das Verbinden getrennter Systeme ist ein Kernstück der Arbeit. Welche Tools nutzen Sie?',
      pt: 'Na maioria dos casos, sim — o Tim constrói em torno das ferramentas que você já usa (CRM, planilhas, agendas, mensagens), em vez de substituí-las. Conectar sistemas desconectados é parte central do trabalho. Quais ferramentas você usa?',
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
      en: 'None at all. You bring the deep knowledge of your business; Tim handles every technical decision and explains things in plain language as you go.',
      de: 'Überhaupt keine. Sie bringen das tiefe Wissen über Ihr Geschäft mit; Tim übernimmt jede technische Entscheidung und erklärt alles in klarer Sprache.',
      pt: 'Nenhum. Você traz o conhecimento profundo do seu negócio; o Tim cuida de cada decisão técnica e explica tudo em linguagem simples.',
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
      en: 'Yes — Tim works remotely with clients across time zones and delivers in German, English and Portuguese.',
      de: 'Ja — Tim arbeitet remote mit Kunden über Zeitzonen hinweg und liefert auf Deutsch, Englisch und Portugiesisch.',
      pt: 'Sim — o Tim trabalha remotamente com clientes em diferentes fusos e entrega em alemão, inglês e português.',
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
      en: "Tim eliminates repetitive work and connects systems — customer-inquiry automation (WhatsApp/email/forms), CRM and calendar integrations, document and intake workflows, and custom internal tools, often built with AI. What's eating most of your time right now?",
      de: 'Tim beseitigt repetitive Arbeit und verbindet Systeme — Automatisierung von Kundenanfragen (WhatsApp/E-Mail/Formulare), CRM- und Kalender-Integrationen, Dokumenten- und Intake-Workflows sowie individuelle interne Tools, oft mit KI. Was frisst gerade die meiste Zeit?',
      pt: 'O Tim elimina trabalho repetitivo e conecta sistemas — automação de contatos de clientes (WhatsApp/e-mail/formulários), integrações de CRM e agenda, fluxos de documentos e cadastro, e ferramentas internas sob medida, muitas vezes com IA. O que mais consome o seu tempo hoje?',
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
      en: "I'm Tim's assistant. Tim is a German software developer and automation specialist working from Rio — he's built a module-handbook web app for the University of Applied Sciences Flensburg, CE machine-safety software for an engineering firm, and his own AI education product, educAItion. Anything you'd like to automate?",
      de: 'Ich bin Tims Assistent. Tim ist ein deutscher Softwareentwickler und Automatisierungsspezialist in Rio — er hat eine Modulhandbuch-Web-App für die Hochschule Flensburg gebaut, CE-Maschinensicherheits-Software für ein Ingenieurbüro und sein eigenes KI-Bildungsprodukt educAItion. Was möchten Sie automatisieren?',
      pt: 'Sou o assistente do Tim. Ele é um desenvolvedor de software e especialista em automação alemão que trabalha do Rio — construiu um app web de manuais de módulos para a University of Applied Sciences Flensburg, software CE de segurança de máquinas para uma empresa de engenharia, e seu próprio produto de IA para educação, o educAItion. O que você gostaria de automatizar?',
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
      en: "Easy — book a free strategy call or send a message through the form on this page, and Tim replies within 24 hours. Tap 'Book a call' below to grab a slot.",
      de: 'Ganz einfach — buchen Sie ein kostenloses Strategiegespräch oder schreiben Sie über das Formular auf dieser Seite; Tim antwortet innerhalb von 24 Stunden. Tippen Sie unten auf „Termin buchen".',
      pt: "Fácil — agende uma conversa de estratégia gratuita ou envie uma mensagem pelo formulário desta página; o Tim responde em até 24 horas. Toque em 'Agendar conversa' abaixo.",
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
