import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NotificationService } from '../../../../../core/services/notification.service';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { EmployerRuleField, EmployerRuleSet } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

@Component({
  selector: 'vpa-employer-rules',
  standalone: true,
  imports: [DatePipe, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './employer-rules.component.html',
  styleUrl: './employer-rules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployerRulesComponent implements OnInit {
  private readonly billing = inject(WeeklyBillingService);
  private readonly notifications = inject(NotificationService);

  readonly ruleSets = signal<EmployerRuleSet[]>([]);
  readonly selectedEmployerId = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeRuleSet = computed(
    () => this.ruleSets().find((ruleSet) => ruleSet.employerId === this.selectedEmployerId()) ?? null,
  );

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.loading.set(true);
    this.error.set(null);
    this.billing.getEmployerRules().subscribe({
      next: (ruleSets) => {
        this.ruleSets.set(ruleSets);
        if (!ruleSets.some((ruleSet) => ruleSet.employerId === this.selectedEmployerId())) {
          this.selectedEmployerId.set(ruleSets[0]?.employerId ?? '');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load employer rules.');
        this.loading.set(false);
      },
    });
  }

  selectEmployer(event: Event): void {
    this.selectedEmployerId.set((event.target as HTMLSelectElement).value);
  }

  setFieldValue(field: EmployerRuleField, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const value = field.type === 'boolean'
      ? (input as HTMLInputElement).checked
      : field.type === 'number'
        ? (input.value === '' ? '' : Number(input.value))
        : input.value;
    this.ruleSets.update((sets) => sets.map((set) => set.employerId === this.selectedEmployerId()
      ? { ...set, fields: set.fields.map((current) => current.key === field.key ? { ...current, value } : current) }
      : set));
  }

  saveRules(): void {
    const ruleSet = this.activeRuleSet();
    if (!ruleSet) return;
    this.saving.set(true);
    this.error.set(null);
    this.billing.saveEmployerRules(ruleSet).subscribe({
      next: (saved) => {
        this.ruleSets.update((sets) => sets.map((set) => set.employerId === saved.employerId ? saved : set));
        this.saving.set(false);
        this.notifications.success('Employer rules saved.');
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Could not save employer rules.');
      },
    });
  }
}
