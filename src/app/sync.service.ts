import { Injectable, signal } from '@angular/core';
import { db } from './db';
import { RETENTION_DAYS, addDays, iso } from './models';

@Injectable({ providedIn: 'root' })
export class Sync {
  status = signal('');
  token() { return localStorage.getItem('bc_token') ?? ''; }
  setToken(t: string) { localStorage.setItem('bc_token', t.trim()); }

  async run() {
    const token = this.token();
    if (!token) { this.status.set('Add your sync token in Settings'); return; }
    const since: number = (await db.settings.get('lastSync'))?.value ?? 0;
    const sessions = (await db.sessions.toArray()).filter(s => (s.updatedAt ?? 1) > since);
    const programs = (await db.programs.toArray()).filter(p => (p.updatedAt ?? 1) > since);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ since: Math.max(0, since - 300000), sessions, programs }),
      });
      if (res.status === 401) { this.status.set('Wrong token'); return; }
      if (!res.ok) throw new Error(String(res.status));
      const r = await res.json();
      for (const s of r.sessions) { const l = await db.sessions.get(s.id); if (!l || (l.updatedAt ?? 0) < s.updatedAt) await db.sessions.put(s); }
      for (const p of r.programs) { const l = await db.programs.get(p.id); if (!l || (l.updatedAt ?? 0) < p.updatedAt) await db.programs.put(p); }
      await db.sessions.where('date').below(addDays(iso(new Date()), -RETENTION_DAYS)).delete();
      await db.settings.put({ key: 'lastSync', value: r.now });
      this.status.set('Synced ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch { this.status.set('Offline. Will sync next time.'); }
  }
}