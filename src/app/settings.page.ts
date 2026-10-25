import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { db } from './db';
import { Sync } from './sync.service';

@Component({
  selector: 'app-settings', standalone: true, imports: [FormsModule],
  template: `
  <h1>Settings</h1>
  <section class="card">
    <h2>Cloud sync</h2>
    <p class="mut">Paste your sync token once on this device.</p>
    <input type="password" placeholder="Sync token" [(ngModel)]="token">
    <p><button class="btn" (click)="saveToken()">Save token</button>
       <button class="btn" (click)="sync.run()">Sync now</button></p>
    <p class="mut">{{ sync.status() }}</p>
  </section>
  <section class="card">
    <h2>Bodyweight (kg)</h2>
    <input type="number" inputmode="decimal" [(ngModel)]="weight" (change)="saveWeight()">
  </section>`,
})
export class SettingsPage implements OnInit {
  token = ''; weight: number | null = null;
  constructor(public sync: Sync) {}
  async ngOnInit() { this.token = this.sync.token(); this.weight = (await db.settings.get('bodyweight'))?.value ?? null; }
  saveToken() { this.sync.setToken(this.token); this.sync.run(); }
  saveWeight() { return db.settings.put({ key: 'bodyweight', value: this.weight }); }
}