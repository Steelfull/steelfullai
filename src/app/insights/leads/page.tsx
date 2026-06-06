import Link from 'next/link';
import { listLeads, leadStats } from '@/lib/leadsDb';
import { LeadStatusCell } from './LeadStatusCell';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-canvas-raised p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, '')}`;

export default function LeadsPage() {
  const leads = listLeads();
  const stats = leadStats();

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Leads</h1>
          <p className="mt-1 text-sm text-ink-500">
            Prospectos coletados pela lead engine. Privado — protegido por login.
          </p>
        </div>
        <Link
          href="/insights"
          className="rounded-full border border-ink-900/15 bg-canvas-raised px-4 py-2 text-sm font-medium text-ink-700 shadow-soft transition hover:border-forest-500/40"
        >
          ← Insights
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={String(stats.total)} />
        <Stat label="Com e-mail" value={String(stats.withEmail)} />
        <Stat label="Nichos" value={String(stats.byNiche.length)} />
        <Stat
          label="Novos"
          value={String(stats.byStatus.find((s) => s.status === 'new')?.count ?? 0)}
        />
      </div>

      {leads.length === 0 ? (
        <div className="rounded-3xl border border-ink-900/10 bg-canvas-raised p-8 text-center text-sm text-ink-500 shadow-soft">
          Nenhum lead ainda. Rode <code className="font-mono">node leadgen/cli.js source</code> e{' '}
          <code className="font-mono">push</code> para popular esta lista.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink-900/10 bg-canvas-raised shadow-soft">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Nicho</th>
                <th className="px-4 py-3 font-medium">Serviço sugerido</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-ink-900/5 align-top hover:bg-canvas-sunk/50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {l.name}
                    {l.address ? <span className="block text-xs text-ink-400">{l.address}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{l.niche}</td>
                  <td className="px-4 py-3 text-ink-600">{l.suggestedService}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.phone ? (
                      <a className="text-forest-500 hover:underline" href={waLink(l.phone)} target="_blank" rel="noopener noreferrer">
                        {l.phone}
                      </a>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <a className="text-forest-500 hover:underline" href={`mailto:${l.email}`}>
                        {l.email}
                      </a>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.website ? (
                      <a className="text-forest-500 hover:underline" href={l.website} target="_blank" rel="noopener noreferrer">
                        site ↗
                      </a>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusCell id={l.id} initial={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
