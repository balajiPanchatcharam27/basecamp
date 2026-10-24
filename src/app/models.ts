export type ExType = 'lift' | 'cardio';
export interface Exercise { id: string; name: string; type: ExType; target: string }
export interface PlanDay { weekday: number; name: string; exercises: Exercise[] } // 0 = Mon
export interface Program { id: string; startDate: string; editableFrom: string; days: PlanDay[] }
export interface SetLog { weight?: number; reps?: number; distanceKm?: number; minutes?: number }
export interface Session { id: string; date: string; entries: { exerciseId: string; sets: SetLog[] }[] }

export const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };