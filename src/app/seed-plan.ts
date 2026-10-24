import { PlanDay, Exercise } from './models';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const L = (name: string, target: string): Exercise => ({ id: slug(name), name, type: 'lift', target });
const C = (name: string, target: string): Exercise => ({ id: slug(name), name, type: 'cardio', target });

export const SEED_PLAN: PlanDay[] = [
  { weekday: 0, name: 'Lower A', exercises: [
    L('Barbell Squat', '4×6–8, heavy'), L('Walking Lunges (weighted)', '3×10/leg'),
    L('Leg Press', '3×10–12'), L('Leg Extension', '2×15'), L('Standing Calf Raise', '4×12')] },
  { weekday: 1, name: 'Push + Core + Tempo Run', exercises: [
    L('Incline Dumbbell Press', '3×8–10'), L('Overhead DB Press', '3×8–10'),
    L('Dumbbell Lateral Raise', '4×12–15'), L('Cable Chest Fly', '3×12–15'),
    L('Tricep Pushdown', '3×12'), L('Overhead Tricep Extension', '3×12'),
    L('Hanging Leg Raise', '3×max'), L('Pallof Press', '3×10/side'),
    C('Tempo Run', '20 min: 10 easy + 10 at ~5:50–6:00/km')] },
  { weekday: 2, name: 'Lower B', exercises: [
    L('Hip Thrust (barbell)', '4×8–12, 2s pause'), L('Dumbbell RDL', '3–4×8–10'),
    L('Bulgarian Split Squat', '3×10/leg'), L('Cable Glute Kickback', '3×15/leg'),
    L('Seated Leg Curl', '3×12')] },
  { weekday: 3, name: 'Pull + Core + Easy Run', exercises: [
    L('Lat Pulldown / Pull-ups', '3×8–10'), L('Seated Cable Row', '3×10–12'),
    L('Face Pulls', '3×15'), L('Hammer Curls', '3×10–12'), L('Incline DB Curl', '3×12'),
    L('Dead Bug', '3×12/side'), L('Plank', '3×45s'),
    C('Easy Run', '20–25 min, ~6:45–7:00/km')] },
  { weekday: 4, name: 'Full Body Pump + Core', exercises: [
    L('Sumo Squat (dumbbell)', '3×12'), L('Single-Leg Glute Bridge', '3×15/leg'),
    L('Banded Lateral Walk', '3×15 steps/side'), L('Flat DB Press', '2×12'),
    L('Cable Lateral Raise', '3×15/side'), L('Single-Arm Row', '2×12/side'),
    L('Cable Woodchop', '3×12/side'), L('Plank', '2×60s'),
    L('Bicep/Tricep Superset', '3×12 each'), C('Shakeout Jog', '15 min, very easy')] },
  { weekday: 5, name: 'Long Run', exercises: [
    C('Long Run', '15–20 km easy ~6:40–7:00/km; every 2nd–3rd week last 3–5 km at ~6:10–6:20')] },
  { weekday: 6, name: 'Rest', exercises: [] },
];