/**
 * Centralized contact configuration.
 *
 * Every CTA across the site reads from this file — there are no hardcoded
 * contact URLs anywhere in the components. Update these values (or the matching
 * environment variables) to repoint every button at once.
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5521989667160';
const WHATSAPP_GREETING =
  process.env.NEXT_PUBLIC_WHATSAPP_GREETING ??
  'Hi Tim-Luka, I would like to talk about automating my business.';

export const contact = {
  calendlyUrl:
    process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/tim-luka_stahl',
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`,
  emailAddress: process.env.NEXT_PUBLIC_EMAIL_ADDRESS ?? 'tim@steelfullai.com',
  get emailUrl() {
    return `mailto:${this.emailAddress}`;
  },
  social: {
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/in/steelfullai',
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/steelfullai',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/steelfullai',
  },
} as const;

export type ContactConfig = typeof contact;
