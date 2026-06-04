import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { RoiCalculator } from '@/components/RoiCalculator';
import { ProblemSection } from '@/components/ProblemSection';
import { TransformationSection } from '@/components/TransformationSection';
import { ImpactSection } from '@/components/ImpactSection';
import { AboutSection } from '@/components/AboutSection';
import { ProcessSection } from '@/components/ProcessSection';
import { UseCasesSection } from '@/components/UseCasesSection';
import { FaqSection } from '@/components/FaqSection';
import { FinalCta } from '@/components/FinalCta';
import { Footer } from '@/components/Footer';
import { StructuredData } from '@/components/StructuredData';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as (typeof routing.locales)[number]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <StructuredData locale={locale} />
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-canvas" />
        <div className="absolute inset-x-0 top-0 h-[720px] bg-radial-forest opacity-90" />
        <div className="absolute inset-0 bg-grid-ink [background-size:72px_72px] opacity-60 mask-fade-b" />
      </div>

      <Navbar />
      <main id="main">
        <Hero />
        <RoiCalculator />
        <ProblemSection />
        <TransformationSection />
        <ImpactSection />
        <AboutSection />
        <ProcessSection />
        <UseCasesSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
