const RETENTION_DAYS = 180;
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

async function batch(db: any, stmts: any[]) {
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

export default {
  async fetch(req: Request, env: any): Promise<Response> {
  try { return await (this as any).handle(req, env); }
  catch (e: any) { return json({ error: String(e?.message ?? e) }, 500); }
},
  async handle(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== '/api/sync') return env.ASSETS.fetch(req);
    if (req.method !== 'POST') return json({ error: 'method' }, 405);
    if (!env.SYNC_TOKEN || req.headers.get('authorization') !== `Bearer ${env.SYNC_TOKEN}`) return json({ error: 'unauthorized' }, 401);

    const body: any = await req.json();
    const since = Number(body.since) || 0;
    const stmts: any[] = [];
    for (const s of body.sessions ?? []) {
      stmts.push(env.DB.prepare(
        `INSERT INTO sessions (id,date,updated_at,data) VALUES (?1,?2,?3,?4)
         ON CONFLICT(id) DO UPDATE SET date=excluded.date, updated_at=excluded.updated_at, data=excluded.data
         WHERE excluded.updated_at >= sessions.updated_at`
      ).bind(s.id, s.date, s.updatedAt ?? 1, JSON.stringify(s.entries ?? [])));
    }
    for (const p of body.programs ?? []) {
      stmts.push(env.DB.prepare(
        `INSERT INTO programs (id,start_date,updated_at,data) VALUES (?1,?2,?3,?4)
         ON CONFLICT(id) DO UPDATE SET start_date=excluded.start_date, updated_at=excluded.updated_at, data=excluded.data
         WHERE excluded.updated_at >= programs.updated_at`
      ).bind(p.id, p.startDate, p.updatedAt ?? 1, JSON.stringify({ editableFrom: p.editableFrom, days: p.days })));
    }
    await batch(env.DB, stmts);

    const s = await env.DB.prepare(
      `SELECT id,date,updated_at,data FROM sessions WHERE updated_at > ?1 AND date >= date('now', ?2)`
    ).bind(since, `-${RETENTION_DAYS} days`).all();
    const p = await env.DB.prepare(`SELECT id,start_date,updated_at,data FROM programs WHERE updated_at > ?1`).bind(since).all();

    return json({
      now: Date.now(),
      sessions: s.results.map((r: any) => ({ id: r.id, date: r.date, updatedAt: r.updated_at, entries: JSON.parse(r.data) })),
      programs: p.results.map((r: any) => ({ id: r.id, startDate: r.start_date, updatedAt: r.updated_at, ...JSON.parse(r.data) })),
    });
  },

  async scheduled(_e: unknown, env: any) {
    await env.DB.prepare(`DELETE FROM sessions WHERE date < date('now', ?1)`).bind(`-${RETENTION_DAYS} days`).run();
  },
};