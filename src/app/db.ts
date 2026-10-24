import Dexie, { Table } from 'dexie';
import { Program, Session } from './models';

class AppDb extends Dexie {
  programs!: Table<Program, string>;
  sessions!: Table<Session, string>;
  settings!: Table<{ key: string; value: any }, string>;
  constructor() {
    super('basecamp');
    this.version(1).stores({ programs: 'id,startDate', sessions: 'id,date', settings: 'key' });
  }
}
export const db = new AppDb();