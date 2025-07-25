import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TrafficStat, CreateTrafficStatRequest } from '../types/traffic-stat.interface';

@Injectable({
  providedIn: 'root'
})
export class TrafficStatsService {
  private trafficStats$ = new BehaviorSubject<TrafficStat[]>([]);
  private usedIds = new Set<number>();

  constructor() {
    // Инициализация с примером данных
    this.initializeWithSampleData();
  }

  private initializeWithSampleData(): void {
    const sampleData: TrafficStat[] = [
      {
        origin: null,
        conversion_ratio: 0,
        successful_leads: 3,
        total_ftds: 0,
        total_leads: 3,
        late_total_ftds: 0,
        revenue: 0,
        name: "BBB",
        id: 581
      },
      {
        origin: null,
        conversion_ratio: 0,
        successful_leads: 1,
        total_ftds: 0,
        total_leads: 1,
        late_total_ftds: 0,
        revenue: 0,
        name: "AAA",
        id: 2891
      }
    ];

    this.trafficStats$.next(sampleData);
    // Добавляем ID из примера данных в usedIds
    sampleData.forEach(stat => this.usedIds.add(stat.id));
  }

  getTrafficStats(): Observable<TrafficStat[]> {
    return this.trafficStats$.asObservable();
  }

  getCurrentStats(): TrafficStat[] {
    return this.trafficStats$.value;
  }

  addTrafficStat(request: CreateTrafficStatRequest): TrafficStat {
    const newStat: TrafficStat = {
      id: this.generateRandomId(),
      name: request.name,
      origin: request.origin || null,
      successful_leads: request.successful_leads,
      total_ftds: request.total_ftds,
      total_leads: request.total_leads,
      late_total_ftds: request.late_total_ftds,
      revenue: request.revenue,
      conversion_ratio: this.calculateConversionRatio(request.total_ftds, request.total_leads)
    };

    const currentStats = this.getCurrentStats();
    this.trafficStats$.next([...currentStats, newStat]);

    return newStat;
  }

  updateTrafficStat(id: number, updates: Partial<CreateTrafficStatRequest>): TrafficStat | null {
    const currentStats = this.getCurrentStats();
    const index = currentStats.findIndex(stat => stat.id === id);

    if (index === -1) {
      return null;
    }

    const updatedStat: TrafficStat = {
      ...currentStats[index],
      ...updates,
      conversion_ratio: this.calculateConversionRatio(
        updates.total_ftds ?? currentStats[index].total_ftds,
        updates.total_leads ?? currentStats[index].total_leads
      )
    };

    const newStats = [...currentStats];
    newStats[index] = updatedStat;
    this.trafficStats$.next(newStats);

    return updatedStat;
  }

  updateStatId(oldId: number, newId: number): boolean {
    const currentStats = this.getCurrentStats();
    const index = currentStats.findIndex(stat => stat.id === oldId);

    if (index === -1) {
      return false;
    }

    // Проверяем, не занят ли новый ID
    const idExists = currentStats.some(stat => stat.id === newId);
    if (idExists) {
      return false;
    }

    // Обновляем ID
    const updatedStat: TrafficStat = {
      ...currentStats[index],
      id: newId
    };

    const newStats = [...currentStats];
    newStats[index] = updatedStat;
    this.trafficStats$.next(newStats);

    // Обновляем usedIds
    this.usedIds.delete(oldId);
    this.usedIds.add(newId);

    return true;
  }

  deleteTrafficStat(id: number): boolean {
    const currentStats = this.getCurrentStats();
    const filteredStats = currentStats.filter(stat => stat.id !== id);

    if (filteredStats.length === currentStats.length) {
      return false; // Элемент не найден
    }

    this.trafficStats$.next(filteredStats);
    this.usedIds.delete(id); // Удаляем ID из используемых
    return true;
  }

  generateJsonOutput(): string {
    return JSON.stringify(this.getCurrentStats(), null, 2);
  }

  generateCompactJsonOutput(): string {
    return JSON.stringify(this.getCurrentStats());
  }

  clearAllStats(): void {
    this.trafficStats$.next([]);
    this.usedIds.clear();
  }

  importFromJson(jsonString: string): boolean {
    try {
      const importedStats: TrafficStat[] = JSON.parse(jsonString);

      // Валидация импортированных данных
      if (!Array.isArray(importedStats)) {
        throw new Error('Invalid JSON format: expected array');
      }

      for (const stat of importedStats) {
        if (!this.isValidTrafficStat(stat)) {
          throw new Error('Invalid traffic stat object');
        }
      }

      this.trafficStats$.next(importedStats);

      // Обновляем usedIds
      this.usedIds.clear();
      importedStats.forEach(stat => this.usedIds.add(stat.id));

      return true;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return false;
    }
  }

  private generateRandomId(): number {
    let newId: number;
    let attempts = 0;
    const maxAttempts = 100; // Защита от бесконечного цикла

    do {
      newId = Math.floor(Math.random() * (3000 - 500 + 1)) + 500; // От 500 до 3000
      attempts++;

      if (attempts > maxAttempts) {
        // Если не можем найти свободный ID в диапазоне, генерируем больший
        newId = Math.floor(Math.random() * 10000) + 3001;
        break;
      }
    } while (this.usedIds.has(newId));

    this.usedIds.add(newId);
    return newId;
  }

  private calculateConversionRatio(totalFtds: number, totalLeads: number): number {
    if (totalLeads === 0) return 0;
    return Number((totalFtds / totalLeads).toFixed(4));
  }

  private isValidTrafficStat(obj: any): obj is TrafficStat {
    return (
      typeof obj === 'object' &&
      typeof obj.id === 'number' &&
      typeof obj.name === 'string' &&
      (obj.origin === null || typeof obj.origin === 'string') &&
      typeof obj.conversion_ratio === 'number' &&
      typeof obj.successful_leads === 'number' &&
      typeof obj.total_ftds === 'number' &&
      typeof obj.total_leads === 'number' &&
      typeof obj.late_total_ftds === 'number' &&
      typeof obj.revenue === 'number'
    );
  }
}
