import { Component, OnInit, signal, computed } from '@angular/core';
import { db } from './db';
import { Session } from './models';
import { Store } from './store.service';

@Component({
  selector: 'app-history', standalone: true,
  template: `
  <h1>History</h1>
  <select (change)="filter.set($any($event.target).value)">
    <option value="">All exercises</option>
    @for (id of ids(); track id) { <option [value]="id">{{ names()[id] ?? id }}</option> }
  </select>
  @for (s of shown(); track s.id) {
    <section class="card">
      <h2>{{ label(s.date) }}</h2>
      @for (e of s.entries; track e.exerciseId) {
        @if (!filter() || filter() === e.exerciseId) {
          <p><b>{{ names()[e.exerciseId] ?? e.exerciseId }}</b><br>
          <span class="mut">{{ fmt(e.sets) }}</span></p>
        }
      }
    </section>
  } @empty { <p class="mut">No sessions yet.</p> }`,
})
export class HistoryPage implements OnInit {
  sessions = signal<Session[]>([]);
  names = signal<Record<string, string>>({});
  filter = signal('');
  ids = computed(() => Object.keys(this.names()).sort((a, b) => (this.names()[a] ?? a).localeCompare(this.names()[b] ?? b)));
  shown = computed(() => this.sessions().filter(s => !this.filter() || s.entries.some(e => e.exerciseId === this.filter())));
  constructor(private store: Store) {}
  async ngOnInit() {
    await this.store.ready();
    const map: Record<string, string> = {};
    for (const p of await db.programs.toArray()) for (const d of p.days) for (const e of d.exercises) map[e.id] = e.name;
    this.names.set(map);
    this.sessions.set(await this.store.history());
  }
  label(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  fmt(sets: any[]) {
    return sets.map(s => s.distanceKm ? `${s.distanceKm} km in ${s.minutes ?? '?'} min` : `${s.weight ?? '-'} kg × ${s.reps ?? '-'}`).join('  ·  ');
  }
}