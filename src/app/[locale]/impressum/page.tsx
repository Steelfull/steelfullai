import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { contact } from '@/config/contact';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum und Anbieterkennzeichnung von SteelfullAI.',
};

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as (typeof routing.locales)[number]);

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="container-content py-28 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <h1 className="heading-lg">Impressum</h1>

          <div className="mt-10 space-y-8 leading-relaxed text-ink-500">
            <section>
              <h2 className="text-lg font-semibold text-ink-900">Angaben gemäß § 5 DDG</h2>
              <p className="mt-3">
                Tim-Luka Stahl
                <br />
                [Straße und Hausnummer]
                <br />
                [PLZ und Ort]
                <br />
                [Land]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">Kontakt</h2>
              <p className="mt-3">
                E-Mail:{' '}
                <a href={contact.emailUrl} className="text-forest-600 hover:underline">
                  {contact.emailAddress}
                </a>
                <br />
                Telefon: [Telefonnummer]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">Umsatzsteuer-ID</h2>
              <p className="mt-3">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
                <br />
                [USt-IdNr. – falls vorhanden, sonst diesen Abschnitt entfernen]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">
                Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
              </h2>
              <p className="mt-3">
                Tim-Luka Stahl
                <br />
                [Anschrift wie oben]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">Haftung für Inhalte</h2>
              <p className="mt-3">
                Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet,
                übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
                Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach
                den allgemeinen Gesetzen bleiben hiervon unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">Haftung für Links</h2>
              <p className="mt-3">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
                keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
                Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">Urheberrecht</h2>
              <p className="mt-3">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
                unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
                gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">EU-Streitschlichtung</h2>
              <p className="mt-3">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
                bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest-600 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
