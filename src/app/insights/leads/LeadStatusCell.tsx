'use client';

import { useState } from 'react';

const OPTIONS = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'no_interest', label: 'Sem interesse' },
  { value: 'won', label: 'Fechado' },
] as const;

const STYLE: Record<string, string> = {
  new: 'bg-canvas-sunk text-ink-600',
  contacted: 'bg-blue-50 text-blue-700',
  qualified: 'bg-forest-50 text-forest-700',
  no_interest: 'bg-red-50 text-red-700',
  won: 'bg-forest-500 text-canvas-soft',
};

export function LeadStatusCell({ id, initial }: { id: number; initial: string }) {
  const [status, setStatus] = useState(initial || 'new');
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch('/api/insights/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      setStatus(prev); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value)}
      disabled={saving}
      className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium outline-none transition ${
        STYLE[status] ?? STYLE.new
      } ${saving ? 'opacity-50' : ''}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className="bg-canvas-raised text-ink-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}
