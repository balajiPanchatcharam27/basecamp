import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from './store.service';
import { db } from './db';
import { Exercise, PlanDay, SetLog, addDays, iso } from './models';

interface Row { ex: Exercise; sets: SetLog[]; last?: SetLog[]; best?: { weight: number; reps: number }; bestPace?: number }
const fmtPace = (min: number, km: number) => {
  const p = min / km, m = Math.floor(p), s = Math.round((p - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
};

@Component({
  selector: 'app-today', standalone: true, imports: [FormsModule],
  template: `
  <div class="tabs">
    @for (d of dayNames; track $index) {
      <button class="tab" [class.on]="selected() === $index" [class.today]="$index === todayIdx" (click)="select($index)">
        {{ d }}@if (done().has(dates[$index])) {<i>✓</i>}
      </button>
    }
  </div>
  <h1>{{ plan()?.name ?? '' }}</h1>
  <p class="mut">{{ dateLabel() }}</p>
  @if (plan() && plan()!.exercises.length === 0) { <div class="card">Rest day. Recover.</div> }
  @for (r of rows(); track r.ex.id) {
    <section class="card">
      <h2>{{ r.ex.name }}</h2>
      <p class="mut">Target: {{ r.ex.target }}</p>
      <p class="mut">{{ lastText(r) }}</p>
      <p class="best">{{ bestText(r) }}</p>
      @for (s of r.sets; track $index) {
        <div class="set">
          <span>{{ $index + 1 }}</span>
          @if (r.ex.type === 'lift') {
            <input type="number" inputmode="decimal" [placeholder]="ph(r, $index, 'weight')" [(ngModel)]="s.weight" (ngModelChange)="dirty.set(true)">
            <input type="number" inputmode="numeric" [placeholder]="ph(r, $index, 'reps')" [(ngModel)]="s.reps" (ngModelChange)="dirty.set(true)">
          } @else {
            <input type="number" inputmode="decimal" placeholder="km" [(ngModel)]="s.distanceKm" (ngModelChange)="dirty.set(true)">
            <input type="number" inputmode="decimal" placeholder="min" [(ngModel)]="s.minutes" (ngModelChange)="dirty.set(true)">
          }
        </div>
      }
    </section>
  }
  <div class="savebar">
    <button (click)="save()" [disabled]="!dirty()">Save</button>
    <span class="mut">{{ status() }}</span>
  </div>`,
})
export class TodayPage implements OnInit {
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  todayIdx = (new Date().getDay() + 6) % 7;
  dates: string[] = (() => { const mon = addDays(iso(new Date()), -this.todayIdx); return this.dayNames.map((_, i) => addDays(mon, i)); })();
  selected = signal(this.todayIdx);
  plan = signal<PlanDay | undefined>(undefined);
  rows = signal<Row[]>([]);
  done = signal<Set<string>>(new Set());
  dirty = signal(false);
  status = signal('');
  constructor(private store: Store) {}

  get date() { return this.dates[this.selected()]; }
  dateLabel() { return new Date(this.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }); }

  async ngOnInit() {
    await this.store.ready();
    await this.refreshDone();
    await this.load();
  }
  async refreshDone() {
    const s = await db.sessions.where('id').anyOf(this.dates).toArray();
    this.done.set(new Set(s.filter(x => x.entries.length).map(x => x.date)));
  }
  async select(i: number) {
    if (i === this.selected()) return;
    if (this.dirty() && !confirm('Discard unsaved changes?')) return;
    this.selected.set(i); this.dirty.set(false); this.status.set('');
    await this.load();
  }
  async load() {
    const date = this.date;
    const plan = await this.store.planFor(new Date(date + 'T12:00:00'));
    this.plan.set(plan);
    const saved = await db.sessions.get(date);
    const rows: Row[] = [];
    for (const ex of plan?.exercises ?? []) {
      const st = await this.store.stats(ex.id, date);
      const n = ex.type === 'cardio' ? 1 : (parseInt(ex.target) || 3);
      const prev = saved?.entries.find(e => e.exerciseId === ex.id)?.sets ?? [];
      const sets = Array.from({ length: Math.max(n, prev.length) }, (_, i) => ({ ...(prev[i] ?? {}) }));
      rows.push({ ex, sets, last: st.last, best: st.best, bestPace: st.bestPace });
    }
    this.rows.set(rows);
  }

  ph(r: Row, i: number, k: 'weight' | 'reps') { return String(r.last?.[i]?.[k] ?? (k === 'weight' ? 'kg' : 'reps')); }
  lastText(r: Row) {
    if (!r.last?.length) return 'Last: no history yet';
    if (r.ex.type === 'cardio') { const s = r.last[0]; return s.distanceKm && s.minutes ? `Last: ${s.distanceKm} km in ${s.minutes} min (${fmtPace(s.minutes, s.distanceKm)})` : 'Last: logged'; }
    return 'Last: ' + r.last.filter(s => s.weight != null || s.reps != null).map(s => `${s.weight ?? '-'}×${s.reps ?? '-'}`).join(' · ');
  }
  bestText(r: Row) {
    if (r.ex.type === 'cardio') return r.bestPace ? `Best pace: ${fmtPace(r.bestPace, 1)}` : 'Best: none yet';
    return r.best ? `Best: ${r.best.weight} kg × ${r.best.reps}` : 'Best: none yet';
  }
  async save() {
    const has = (s: SetLog) => s.weight != null || s.reps != null || s.distanceKm != null || s.minutes != null;
    const entries = this.rows().map(r => ({ exerciseId: r.ex.id, sets: r.sets.filter(has) })).filter(e => e.sets.length);
    if (entries.length) await this.store.saveSession({ id: this.date, date: this.date, entries });
    else await db.sessions.delete(this.date);
    await this.refreshDone();
    this.dirty.set(false);
    this.status.set('Saved ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }
}