# STEELFULLAI

Premium marketing site for **SteelfullAI** — the personal brand of Tim-Luka Stahl, a business automation specialist. Built to feel like a software product launch (Linear / Vercel / Stripe), not an agency site.

Sells **outcomes** (time saved, faster response, less manual work), never frameworks or technology.

## Tech stack

- **Next.js 15** (App Router, RSC) + **TypeScript**
- **TailwindCSS** (custom steel-blue dark design system)
- **Framer Motion** (scroll reveals, animated workflow diagrams, interactive timeline)
- **next-intl** — Portuguese (default), English, German with locale-prefixed routing
- **Lucide React** icons

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Calendly / WhatsApp / email
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Contact configuration

Every CTA reads from a single source of truth — there are **no hardcoded contact URLs** in components.

- Edit [`src/config/contact.ts`](src/config/contact.ts), or override via env vars in `.env.local`:
  - `NEXT_PUBLIC_CALENDLY_URL` (primary CTA)
  - `NEXT_PUBLIC_WHATSAPP_NUMBER` + `NEXT_PUBLIC_WHATSAPP_GREETING`
  - `NEXT_PUBLIC_EMAIL_ADDRESS`
  - `NEXT_PUBLIC_LINKEDIN_URL` / `_GITHUB_URL` / `_INSTAGRAM_URL`

## Internationalization

- Messages live in [`src/messages/{pt,en,de}.json`](src/messages) — all copy, metadata, SEO and buttons are translated.
- The navbar **language switcher** does instant client-side switching (no full reload) and persists the choice to `localStorage`. Returning visitors are restored to their saved language by [`LocalePersistence`](src/components/LocalePersistence.tsx).
- Localized metadata, `hreflang` alternates, `sitemap.ts`, `robots.ts` and JSON-LD structured data are generated per locale.

## Structure

```
src/
├── app/[locale]/        # localized routes, layout (metadata), page, not-found
├── app/sitemap.ts, robots.ts
├── config/contact.ts    # single source for all CTAs
├── i18n/                # next-intl routing, navigation, request config
├── messages/            # pt / en / de translations
├── middleware.ts        # locale negotiation
└── components/
    ├── ui/              # Reveal, Cta, SectionHeader, AnimatedNumber
    ├── Navbar, Hero, HeroWorkflow, RoiCalculator
    ├── ProblemSection, TransformationSection, ImpactSection
    ├── AboutSection, ProcessSection, UseCasesSection
    ├── FaqSection, FinalCta, Footer
    └── LanguageSwitcher, LocalePersistence, StructuredData
```

## Replacing the portrait

[`AboutSection`](src/components/AboutSection.tsx) renders a placeholder. Drop a real photo into `public/` and swap the placeholder block for a `next/image`.
