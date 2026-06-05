import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { contact } from '@/config/contact';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Informationen zum Datenschutz und zur Verarbeitung personenbezogener Daten bei SteelfullAI.',
};

export default async function DatenschutzPage({
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
          <h1 className="heading-lg">Datenschutzerklärung</h1>

          <div className="mt-10 space-y-8 leading-relaxed text-ink-500">
            <section>
              <h2 className="text-lg font-semibold text-ink-900">1. Verantwortlicher</h2>
              <p className="mt-3">
                Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                <br />
                Tim-Luka Stahl
                <br />
                [Straße und Hausnummer]
                <br />
                [PLZ und Ort]
                <br />
                E-Mail:{' '}
                <a href={contact.emailUrl} className="text-forest-600 hover:underline">
                  {contact.emailAddress}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">2. Hosting und Server-Logfiles</h2>
              <p className="mt-3">
                Diese Website wird auf einem eigenen Server (Virtual Private Server bei der
                Hostinger International Ltd.) betrieben. Beim Aufruf der Website werden durch den
                Webserver automatisch Informationen in sogenannten Server-Logfiles erfasst, die
                Ihr Browser übermittelt. Dies sind insbesondere: IP-Adresse, Datum und Uhrzeit
                der Anfrage, aufgerufene Seite/Datei, übertragene Datenmenge, verwendeter Browser
                und Betriebssystem. Diese Daten dienen der technischen Bereitstellung, der
                Sicherheit und der Stabilität der Website. Rechtsgrundlage ist Art. 6 Abs. 1
                lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen
                Betrieb). Die Logfiles werden nach kurzer Zeit automatisch gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">3. Reichweitenmessung mit Umami</h2>
              <p className="mt-3">
                Zur statistischen Auswertung der Besucherzahlen nutzen wir Umami, eine
                datenschutzfreundliche Analyse-Software, die wir selbst auf unserem eigenen Server
                betreiben. Umami verwendet <strong>keine Cookies</strong> und erfasst keine
                personenbezogenen Daten in einer Form, die einen Rückschluss auf einzelne
                Personen zulässt. IP-Adressen werden ausschließlich anonymisiert verarbeitet. Es
                findet <strong>keine Übermittlung an Dritte</strong> statt; alle Daten verbleiben
                auf unserem Server. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
                Interesse an einer reichweitenstarken und sicheren Darstellung unseres Angebots).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">4. Kontaktaufnahme per E-Mail</h2>
              <p className="mt-3">
                Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben zur Bearbeitung der
                Anfrage und für mögliche Anschlussfragen gespeichert. Rechtsgrundlage ist
                Art. 6 Abs. 1 lit. b DSGVO (Anbahnung/Erfüllung eines Vertrags) bzw. lit. f DSGVO
                (berechtigtes Interesse an der Beantwortung von Anfragen). Die Daten werden
                gelöscht, sobald sie nicht mehr erforderlich sind und keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">5. Terminbuchung über Calendly</h2>
              <p className="mt-3">
                Für die Vereinbarung von Gesprächsterminen verlinken wir auf den Dienst Calendly
                (Calendly LLC, USA). Wenn Sie den Buchungslink nutzen, werden Sie auf die Seiten
                von Calendly weitergeleitet, wo die von Ihnen eingegebenen Daten (z. B. Name,
                E-Mail-Adresse, Terminwunsch) verarbeitet werden. Dabei kann es zu einer
                Übermittlung in die USA kommen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und
                lit. f DSGVO. Einzelheiten entnehmen Sie der Datenschutzerklärung von Calendly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">6. Kontakt über WhatsApp</h2>
              <p className="mt-3">
                Sofern Sie uns über den WhatsApp-Link kontaktieren, erfolgt die Kommunikation über
                den Dienst WhatsApp (Meta Platforms Ireland Ltd.). Dabei werden die von Ihnen
                übermittelten Daten durch WhatsApp verarbeitet. Bitte beachten Sie die
                Datenschutzhinweise von WhatsApp. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und
                lit. f DSGVO.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">7. SSL-/TLS-Verschlüsselung</h2>
              <p className="mt-3">
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                vertraulicher Inhalte eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte
                Verbindung erkennen Sie an „https://" in der Adresszeile Ihres Browsers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900">8. Ihre Rechte</h2>
              <p className="mt-3">
                Sie haben jederzeit das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung
                (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
                Datenübertragbarkeit (Art. 20) sowie ein Widerspruchsrecht (Art. 21). Zudem
                steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu. Zur
                Ausübung Ihrer Rechte genügt eine formlose Nachricht an die oben genannte
                E-Mail-Adresse.
              </p>
            </section>

            <p className="text-sm text-ink-400">Stand: {new Date().getFullYear()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
