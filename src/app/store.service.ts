import { Injectable } from '@angular/core';
import { db } from './db';
import { SEED_PLAN } from './seed-plan';
import { PlanDay, Program, SetLog, Session, addDays, iso } from './models';

@Injectable({ providedIn: 'root' })
export class Store {
  async init() {
    if ((await db.programs.count()) === 0) {
      const start = iso(new Date());
      await db.programs.add({ id: crypto.randomUUID(), startDate: start, editableFrom: addDays(start, 42), days: SEED_PLAN,updatedAt: Date.now() });
    }
    navigator.storage?.persist?.();
  }
  async program(): Promise<Program> { return (await db.programs.orderBy('startDate').last())!; }
  async planFor(d: Date): Promise<PlanDay | undefined> {
    const p = await this.program();
    return p.days.find((x:any) => x.weekday === (d.getDay() + 6) % 7);
  }
  async isLocked(): Promise<boolean> { return iso(new Date()) < (await this.program()).editableFrom; }
  async savePlan(days: PlanDay[]) { // new version, so old history keeps its names
    const start = iso(new Date());
    await db.programs.add({ id: crypto.randomUUID(), startDate: start, editableFrom: addDays(start, 42), days , updatedAt: Date.now()});
  }
  async stats(exerciseId: string, beforeDate: string) {
    const past = (await db.sessions.where('date').below(beforeDate).sortBy('date')).reverse();
    let last: SetLog[] | undefined; let best: { weight: number; reps: number } | undefined; let bestPace: number | undefined;
    for (const s of past) {
      const e = s.entries.find((x:any) => x.exerciseId === exerciseId); if (!e) continue;
      last ??= e.sets;
      for (const set of e.sets) {
        if (set.weight != null && set.reps != null && (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps))) best = { weight: set.weight, reps: set.reps };
        if (set.distanceKm && set.minutes) { const pace = set.minutes / set.distanceKm; if (bestPace == null || pace < bestPace) bestPace = pace; }
      }
    }
    return { last, best, bestPace };
  }
  saveSession(s: Session) { return db.sessions.put({ ...s, updatedAt: Date.now() }); }
  async history() { return (await db.sessions.orderBy('date').reverse().toArray()).filter(s => s.entries.length); }
  private _ready?: Promise<void>;
  ready() { return (this._ready ??= this.init()); }
}