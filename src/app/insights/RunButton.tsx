'use client';

import { useState } from 'react';

/** Triggers a fresh insights run, then reloads to show the result. */
export function RunButton() {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  async function run() {
    if (state === 'running') return;
    setState('running');
    try {
      const res = await fetch('/api/insights', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      setState('done');
      setTimeout(() => window.location.reload(), 700);
    } catch {
      setState('error');
    }
  }

  const label =
    state === 'running'
      ? 'Running…'
      : state === 'done'
        ? 'Done — reloading'
        : state === 'error'
          ? 'Failed — retry'
          : 'Run analysis now';

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === 'running'}
      className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-canvas-soft transition hover:bg-forest-600 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
