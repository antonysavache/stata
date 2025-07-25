import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrafficStatsService } from '../services/traffic-stats.service';
import { TrafficStat, CreateTrafficStatRequest } from '../types/traffic-stat.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-traffic-stats-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h1>VPN Traffic Statistics Generator</h1>

      <!-- Генератор пресетов -->
      <div class="form-section generator-section">
        <h2>🎲 Генератор пресетов</h2>
        <form [formGroup]="generatorForm" class="generator-form">
          <div class="generator-row">
            <div class="form-group">
              <label for="totalLeadsMin">Лиды (мин):</label>
              <input
                type="number"
                id="totalLeadsMin"
                formControlName="totalLeadsMin"
                class="form-control"
                min="1"
                placeholder="10"
              >
            </div>
            <div class="form-group">
              <label for="totalLeadsMax">Лиды (макс):</label>
              <input
                type="number"
                id="totalLeadsMax"
                formControlName="totalLeadsMax"
                class="form-control"
                min="1"
                placeholder="100"
              >
            </div>
          </div>

          <div class="generator-row">
            <div class="form-group">
              <label for="advertisersCount">Количество рекламодателей:</label>
              <input
                type="number"
                id="advertisersCount"
                formControlName="advertisersCount"
                class="form-control"
                min="1"
                max="20"
                placeholder="5"
              >
            </div>
          </div>

          <div class="generator-row">
            <div class="form-group">
              <label for="conversionMin">Конверсия % (мин):</label>
              <input
                type="number"
                id="conversionMin"
                formControlName="conversionMin"
                class="form-control"
                min="0"
                max="100"
                step="0.1"
                placeholder="5"
              >
            </div>
            <div class="form-group">
              <label for="conversionMax">Конверсия % (макс):</label>
              <input
                type="number"
                id="conversionMax"
                formControlName="conversionMax"
                class="form-control"
                min="0"
                max="100"
                step="0.1"
                placeholder="25"
              >
            </div>
          </div>

          <div class="generator-row">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="includeNoobs"
                  class="checkbox-input"
                >
                <span class="checkbox-text">Добавить нуба (0% конверсия) 🤡</span>
              </label>
            </div>
          </div>

          <div class="generator-controls">
            <button type="button" (click)="generatePreset()" class="btn btn-primary btn-large">
              🎲 Сгенерировать пресет
            </button>
            <button type="button" (click)="clearAll()" class="btn btn-warning">
              🗑️ Очистить все
            </button>
          </div>
        </form>
      </div>

      <!-- Форма добавления новой статистики -->
      <div class="form-section">
        <h2>Добавить рекламодателя</h2>
        <form [formGroup]="statForm" (ngSubmit)="onSubmit()" class="stat-form">
          <div class="form-group">
            <label for="name">Название рекламодателя:</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-control"
              placeholder="Например: AAA, BBB"
            >
            <div *ngIf="statForm.get('name')?.invalid && statForm.get('name')?.touched" class="error">
              Название обязательно
            </div>
          </div>

          <div class="form-group">
            <label for="origin">Origin (необязательно):</label>
            <input
              type="text"
              id="origin"
              formControlName="origin"
              class="form-control"
              placeholder="Источник трафика"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="successful_leads">Успешные лиды:</label>
              <input
                type="number"
                id="successful_leads"
                formControlName="successful_leads"
                class="form-control"
                min="0"
              >
              <small class="form-text">Будет равно общему количеству лидов</small>
            </div>

            <div class="form-group">
              <label for="total_ftds">Всего FTD:</label>
              <input
                type="number"
                id="total_ftds"
                formControlName="total_ftds"
                class="form-control"
                min="0"
              >
            </div>
          </div>

          <div class="info-text">
            <p><strong>Автоматически устанавливается:</strong></p>
            <ul>
              <li>Общее количество лидов = Успешные лиды</li>
              <li>Поздние FTD = 0</li>
              <li>Доход = 0</li>
              <li>Коэффициент конверсии рассчитывается автоматически</li>
            </ul>
          </div>

          <div class="button-group">
            <button type="submit" [disabled]="statForm.invalid" class="btn btn-primary">
              Добавить рекламодателя
            </button>
            <button type="button" (click)="addNoob()" class="btn btn-secondary">
              Добавить нуба 🤡
            </button>
          </div>
        </form>
      </div>

      <!-- Таблица текущей статистики -->
      <div class="stats-section">
        <h2>Текущая статистика</h2>
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Origin</th>
                <th>Успешные лиды</th>
                <th>Всего лидов</th>
                <th>FTD</th>
                <th>Поздние FTD</th>
                <th>Коэффициент конверсии</th>
                <th>Доход</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let stat of trafficStats$ | async; trackBy: trackByStat">
                <!-- Редактируемый ID -->
                <td>
                  <input
                    type="number"
                    [value]="stat.id"
                    (blur)="updateStatField(stat.id, 'id', $event)"
                    (keydown.enter)="$event.target.blur()"
                    class="editable-input id-input"
                    min="1"
                  >
                </td>

                <!-- Редактируемое название -->
                <td>
                  <input
                    type="text"
                    [value]="stat.name"
                    (blur)="updateStatField(stat.id, 'name', $event)"
                    (keydown.enter)="$event.target.blur()"
                    class="editable-input name-input"
                    placeholder="Название"
                  >
                </td>

                <!-- Origin (не редактируемый) -->
                <td>{{ stat.origin || 'null' }}</td>

                <!-- Редактируемые успешные лиды -->
                <td>
                  <input
                    type="number"
                    [value]="stat.successful_leads"
                    (blur)="updateStatField(stat.id, 'successful_leads', $event)"
                    (keydown.enter)="$event.target.blur()"
                    class="editable-input number-input"
                    min="0"
                  >
                </td>

                <!-- Всего лидов (автоматически = успешным лидам) -->
                <td>{{ stat.total_leads }}</td>

                <!-- Редактируемые FTD -->
                <td>
                  <input
                    type="number"
                    [value]="stat.total_ftds"
                    (blur)="updateStatField(stat.id, 'total_ftds', $event)"
                    (keydown.enter)="$event.target.blur()"
                    class="editable-input number-input"
                    min="0"
                  >
                </td>

                <!-- Поздние FTD (не редактируемый) -->
                <td>{{ stat.late_total_ftds }}</td>

                <!-- Коэффициент конверсии (автоматический) -->
                <td class="conversion-cell">{{ stat.conversion_ratio }}</td>

                <!-- Доход (не редактируемый) -->
                <td>{{ stat.revenue }}</td>

                <!-- Действия -->
                <td>
                  <button (click)="deleteStat(stat.id)" class="btn btn-danger btn-sm">
                    Удалить
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Генерация и экспорт JSON -->
      <div class="json-section">
        <h2>Генерация JSON</h2>
        <div class="json-controls">
          <button (click)="generateJson()" class="btn btn-success">
            Сгенерировать JSON
          </button>
          <button (click)="copyToClipboard()" class="btn btn-secondary">
            Копировать в буфер
          </button>
          <button (click)="clearAll()" class="btn btn-warning">
            Очистить все
          </button>
        </div>

        <div class="json-output">
          <h3>Сгенерированный JSON:</h3>
          <pre class="json-display">{{ generatedJson }}</pre>
        </div>
      </div>

      <!-- Импорт JSON -->
      <div class="import-section">
        <h2>Импорт JSON</h2>
        <textarea
          [(ngModel)]="importJson"
          placeholder="Вставьте JSON для импорта..."
          class="import-textarea"
        ></textarea>
        <button (click)="importFromJson()" class="btn btn-info">
          Импортировать JSON
        </button>
        <div *ngIf="importMessage" class="import-message" [class.success]="importSuccess" [class.error]="!importSuccess">
          {{ importMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    h1, h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .form-section, .stats-section, .json-section, .import-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border: 1px solid #e9ecef;
    }

    .generator-section {
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border: 2px solid #2196f3;
    }

    .generator-section h2 {
      color: #1976d2;
      font-size: 24px;
    }

    .generator-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .generator-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: end;
    }

    .generator-row:last-of-type {
      grid-template-columns: 1fr;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: bold;
      color: #495057;
    }

    .checkbox-input {
      margin-right: 10px;
      transform: scale(1.2);
    }

    .checkbox-text {
      font-size: 16px;
    }

    .generator-controls {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }

    .btn-large {
      font-size: 16px;
      padding: 15px 30px;
      font-weight: bold;
    }

    .stat-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #495057;
    }

    .form-control {
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .form-text {
      font-size: 12px;
      color: #6c757d;
      margin-top: 5px;
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .button-group .btn {
      flex: 1;
      min-width: 200px;
    }

    .info-text {
      background-color: #e7f3ff;
      border: 1px solid #b3d9ff;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
    }

    .info-text p {
      margin: 0 0 10px 0;
      font-weight: bold;
      color: #0066cc;
    }

    .info-text ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-text li {
      color: #495057;
      margin-bottom: 5px;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-success {
      background-color: #28a745;
      color: white;
    }

    .btn-success:hover {
      background-color: #1e7e34;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }

    .btn-warning:hover {
      background-color: #e0a800;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

    .btn-info:hover {
      background-color: #138496;
    }

    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .stats-table th,
    .stats-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }

    .stats-table th {
      background-color: #e9ecef;
      font-weight: bold;
      color: #495057;
    }

    .stats-table tbody tr:hover {
      background-color: #f5f5f5;
    }

    .editable-input {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      padding: 4px 8px;
      font-family: inherit;
      font-size: inherit;
      border-radius: 3px;
      transition: all 0.2s ease;
    }

    .editable-input:hover {
      border-color: #ced4da;
      background-color: #f8f9fa;
    }

    .editable-input:focus {
      outline: none;
      border-color: #007bff;
      background-color: white;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .id-input {
      width: 80px;
      text-align: center;
    }

    .name-input {
      min-width: 100px;
    }

    .number-input {
      width: 70px;
      text-align: center;
    }

    .conversion-cell {
      font-weight: bold;
      color: #28a745;
      background-color: #f8fff9;
    }

    .json-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .json-output {
      margin-top: 20px;
    }

    .json-display {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
      max-height: 400px;
      overflow-y: auto;
    }

    .import-textarea {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      margin-bottom: 10px;
      resize: vertical;
    }

    .import-message {
      margin-top: 10px;
      padding: 10px;
      border-radius: 4px;
    }

    .import-message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .import-message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @media (max-width: 768px) {
      .container {
        padding: 10px;
      }

      .form-row, .generator-row {
        grid-template-columns: 1fr;
      }

      .json-controls {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }

      .button-group, .generator-controls {
        flex-direction: column;
      }

      .button-group .btn {
        min-width: auto;
        width: 100%;
      }
    }
  `]
})
export class TrafficStatsManagerComponent implements OnInit {
  statForm: FormGroup;
  generatorForm: FormGroup;
  trafficStats$: Observable<TrafficStat[]>;
  generatedJson: string = '';
  importJson: string = '';
  importMessage: string = '';
  importSuccess: boolean = false;

  private advertiserNames = [
    'ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA',
    'IOTA', 'KAPPA', 'LAMBDA', 'MU', 'NU', 'XI', 'OMICRON', 'PI',
    'RHO', 'SIGMA', 'TAU', 'UPSILON', 'PHI', 'CHI', 'PSI', 'OMEGA',
    'APEX', 'VERTEX', 'MATRIX', 'NEXUS', 'PRISM', 'QUANTUM', 'VORTEX'
  ];

  constructor(
    private fb: FormBuilder,
    private trafficStatsService: TrafficStatsService
  ) {
    this.statForm = this.fb.group({
      name: ['', [Validators.required]],
      origin: [''],
      successful_leads: [0, [Validators.required, Validators.min(0)]],
      total_ftds: [0, [Validators.required, Validators.min(0)]]
    });

    this.generatorForm = this.fb.group({
      totalLeadsMin: [10, [Validators.required, Validators.min(1)]],
      totalLeadsMax: [100, [Validators.required, Validators.min(1)]],
      advertisersCount: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
      conversionMin: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      conversionMax: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
      includeNoobs: [false]
    });

    this.trafficStats$ = this.trafficStatsService.getTrafficStats();
  }

  ngOnInit(): void {
    this.generateJson();
  }

  generatePreset(): void {
    if (this.generatorForm.invalid) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }

    const formValue = this.generatorForm.value;

    // Валидация диапазонов
    if (formValue.totalLeadsMin > formValue.totalLeadsMax) {
      alert('Минимальное количество лидов не может быть больше максимального');
      return;
    }

    if (formValue.conversionMin > formValue.conversionMax) {
      alert('Минимальная конверсия не может быть больше максимальной');
      return;
    }

    // Очищаем текущую статистику
    this.trafficStatsService.clearAllStats();

    // Генерируем рекламодателей
    const usedNames = new Set<string>();
    const advertisersToGenerate = formValue.includeNoobs ?
      Math.max(1, formValue.advertisersCount - 1) : // Оставляем место для одного нуба
      formValue.advertisersCount;

    // Генерируем обычных рекламодателей
    for (let i = 0; i < advertisersToGenerate; i++) {
      const name = this.getRandomAdvertiserName(usedNames);
      usedNames.add(name);

      const leads = this.getRandomInt(formValue.totalLeadsMin, formValue.totalLeadsMax);
      const conversionPercent = this.getRandomFloat(formValue.conversionMin, formValue.conversionMax);
      const ftds = Math.floor(leads * (conversionPercent / 100));

      const request: CreateTrafficStatRequest = {
        name: name,
        origin: null,
        successful_leads: leads,
        total_leads: leads,
        total_ftds: ftds,
        late_total_ftds: 0,
        revenue: 0
      };

      this.trafficStatsService.addTrafficStat(request);
    }

    // Добавляем одного нуба если нужно
    if (formValue.includeNoobs) {
      this.addSingleNoob(usedNames);
    }

    // Обновляем JSON
    this.generateJson();

    // Показываем уведомление
    const message = `🎲 Сгенерирован пресет:\n` +
      `• ${formValue.advertisersCount} рекламодателей\n` +
      `• Лиды: ${formValue.totalLeadsMin}-${formValue.totalLeadsMax}\n` +
      `• Конверсия: ${formValue.conversionMin}%-${formValue.conversionMax}%\n` +
      `${formValue.includeNoobs ? '• Включен один нуб (6-9 лидов, 0% конверсия) 🤡' : ''}`;

    alert(message);
  }

  private getRandomAdvertiserName(usedNames: Set<string>): string {
    const availableNames = this.advertiserNames.filter(name => !usedNames.has(name));
    if (availableNames.length === 0) {
      // Если все имена использованы, генерируем случайное
      return `ADV_${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    }
    return availableNames[Math.floor(Math.random() * availableNames.length)];
  }

  private addSingleNoob(usedNames: Set<string>): void {
    const noobNames = [
      'NOOB_TRAFFIC',
      'BAD_LEADS',
      'ZERO_FTD',
      'WASTE_MONEY',
      'NO_CONVERT',
      'TRASH_ADS',
      'POOR_QUALITY',
      'USELESS_TRAFFIC',
      'FAKE_LEADS',
      'SPAM_SOURCE'
    ];

    const availableNoobNames = noobNames.filter(name => !usedNames.has(name));
    const noobName = availableNoobNames.length > 0 ?
      availableNoobNames[Math.floor(Math.random() * availableNoobNames.length)] :
      `NOOB_${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    usedNames.add(noobName);

    // Лиды от 6 до 9 для нуба
    const leads = this.getRandomInt(6, 9);

    const noobRequest: CreateTrafficStatRequest = {
      name: noobName,
      origin: null,
      successful_leads: leads,
      total_leads: leads,
      total_ftds: 0, // Всегда 0 для нубов
      late_total_ftds: 0,
      revenue: 0
    };

    this.trafficStatsService.addTrafficStat(noobRequest);
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  onSubmit(): void {
    if (this.statForm.valid) {
      const formValue = this.statForm.value;
      const request: CreateTrafficStatRequest = {
        name: formValue.name,
        origin: formValue.origin || null,
        successful_leads: formValue.successful_leads,
        total_leads: formValue.successful_leads, // Всего лидов = успешным лидам
        total_ftds: formValue.total_ftds,
        late_total_ftds: 0, // Всегда 0
        revenue: 0 // Всегда 0
      };

      this.trafficStatsService.addTrafficStat(request);
      this.statForm.reset({
        name: '',
        origin: '',
        successful_leads: 0,
        total_ftds: 0
      });
      this.generateJson();
    }
  }

  addNoob(): void {
    // Генерируем случайное количество лидов от 6 до 9
    const randomLeads = Math.floor(Math.random() * 4) + 6; // 6, 7, 8 или 9

    // Генерируем случайное имя нуба
    const noobNames = [
      'NOOB_TRAFFIC',
      'BAD_LEADS',
      'ZERO_FTD',
      'WASTE_MONEY',
      'NO_CONVERT',
      'TRASH_ADS',
      'POOR_QUALITY',
      'USELESS_TRAFFIC'
    ];
    const randomName = noobNames[Math.floor(Math.random() * noobNames.length)];

    const noobRequest: CreateTrafficStatRequest = {
      name: randomName,
      origin: null,
      successful_leads: randomLeads,
      total_leads: randomLeads,
      total_ftds: 0, // Всегда 0 для нуба
      late_total_ftds: 0,
      revenue: 0
    };

    this.trafficStatsService.addTrafficStat(noobRequest);
    this.generateJson();

    // Показываем уведомление
    alert(`🤡 Добавлен нуб "${randomName}" с ${randomLeads} лидами и 0 FTD!`);
  }

  deleteStat(id: number): void {
    if (confirm('Вы уверены, что хотите удалить этого рекламодателя?')) {
      this.trafficStatsService.deleteTrafficStat(id);
      this.generateJson();
    }
  }

  generateJson(): void {
    this.generatedJson = this.trafficStatsService.generateJsonOutput();
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.generatedJson);
      alert('JSON скопирован в буфер обмена!');
    } catch (err) {
      console.error('Ошибка при копировании:', err);
      alert('Ошибка при копировании в буфер обмена');
    }
  }

  clearAll(): void {
    if (confirm('Вы уверены, что хотите удалить всю статистику?')) {
      this.trafficStatsService.clearAllStats();
      this.generatedJson = '[]';
    }
  }

  importFromJson(): void {
    if (!this.importJson.trim()) {
      this.showImportMessage('Пожалуйста, введите JSON для импорта', false);
      return;
    }

    const success = this.trafficStatsService.importFromJson(this.importJson);

    if (success) {
      this.showImportMessage('JSON успешно импортирован!', true);
      this.importJson = '';
      this.generateJson();
    } else {
      this.showImportMessage('Ошибка при импорте JSON. Проверьте формат данных.', false);
    }
  }

  updateStatField(statId: number, field: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;

    // Валидация и преобразование значения
    if (field === 'id' || field === 'successful_leads' || field === 'total_ftds') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        // Возвращаем старое значение если введено некорректное число
        const currentStats = this.trafficStatsService.getCurrentStats();
        const currentStat = currentStats.find(s => s.id === statId);
        if (currentStat) {
          const fieldValue = currentStat[field as keyof TrafficStat];
          target.value = fieldValue !== null && fieldValue !== undefined ? fieldValue.toString() : '0';
        }
        return;
      }
      value = numValue;
    }

    // Специальная обработка для ID
    if (field === 'id') {
      this.updateStatId(statId, value);
      return;
    }

    // Подготавливаем объект обновления
    const updates: any = {};
    updates[field] = value;

    // Если изменяются успешные лиды, то total_leads тоже должен измениться
    if (field === 'successful_leads') {
      updates.total_leads = value;
    }

    // Обновляем статистику
    const updatedStat = this.trafficStatsService.updateTrafficStat(statId, updates);

    if (updatedStat) {
      this.generateJson();
    } else {
      // Если обновление не удалось, возвращаем старое значение
      const currentStats = this.trafficStatsService.getCurrentStats();
      const currentStat = currentStats.find(s => s.id === statId);
      if (currentStat) {
        const fieldValue = currentStat[field as keyof TrafficStat];
        target.value = fieldValue !== null && fieldValue !== undefined ? fieldValue.toString() : '0';
      }
    }
  }

  private updateStatId(oldId: number, newId: number): void {
    if (oldId === newId) return;

    // Проверяем, не занят ли новый ID
    const currentStats = this.trafficStatsService.getCurrentStats();
    const idExists = currentStats.some(stat => stat.id === newId && stat.id !== oldId);

    if (idExists) {
      alert(`ID ${newId} уже используется! Выберите другой ID.`);
      // Возвращаем старое значение
      const inputs = document.querySelectorAll('.id-input') as NodeListOf<HTMLInputElement>;
      inputs.forEach(input => {
        if (parseInt(input.value) === newId) {
          input.value = oldId.toString();
        }
      });
      return;
    }

    // Обновляем ID через специальный метод в сервисе
    const success = this.trafficStatsService.updateStatId(oldId, newId);
    if (success) {
      this.generateJson();
    } else {
      alert('Ошибка при обновлении ID');
    }
  }

  trackByStat(index: number, stat: TrafficStat): number {
    return stat.id;
  }

  private showImportMessage(message: string, success: boolean): void {
    this.importMessage = message;
    this.importSuccess = success;

    setTimeout(() => {
      this.importMessage = '';
    }, 3000);
  }
}
