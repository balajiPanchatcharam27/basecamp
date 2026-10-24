import { Routes } from '@angular/router';
import { TodayPage } from './today.page';
import { HistoryPage } from './history.page';
export const routes: Routes = [
  { path: '', component: TodayPage },
  { path: 'history', component: HistoryPage },
  { path: '**', redirectTo: '' },
];