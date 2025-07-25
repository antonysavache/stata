import { Component } from '@angular/core';
import { TrafficStatsManagerComponent } from './components/traffic-stats-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TrafficStatsManagerComponent],
  template: `
    <app-traffic-stats-manager></app-traffic-stats-manager>
  `,
  styles: []
})
export class AppComponent {
  title = 'fake-stat';
}
