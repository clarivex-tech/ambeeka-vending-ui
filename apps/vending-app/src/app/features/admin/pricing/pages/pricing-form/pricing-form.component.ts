import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PricingService } from '../../services/pricing.service';
import { SavePricingRequest } from '../../models/pricing.model';

@Component({
  selector: 'vpa-pricing-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputNumberModule, InputTextModule],
  templateUrl: './pricing-form.component.html',
  styleUrl: './pricing-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pricingService = inject(PricingService);
  private readonly notifications = inject(NotificationService);

  readonly itemId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = this.itemId !== null;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    systemProductId: ['', [Validators.required, Validators.maxLength(64)]],
    systemProductName: ['', [Validators.required, Validators.maxLength(255)]],
    vendPrice: [0.01, [Validators.required, Validators.min(0.01), Validators.max(1_000_000)]],
    productName: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    if (this.itemId) this.loadItem(this.itemId);
  }

  controlInvalid(controlName: keyof SavePricingRequest): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.saveError.set(null);
    if (this.form.invalid || this.loading() || this.saving()) return;

    this.saving.set(true);
    const request = this.form.getRawValue();
    const saveRequest = this.isEditMode && this.itemId
      ? this.pricingService.update(this.itemId, request)
      : this.pricingService.create(request);

    saveRequest.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(this.isEditMode ? 'Pricing item updated.' : 'Pricing item created.');
        void this.router.navigate(['/admin/pricing']);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Could not save this pricing item. Check the values and try again.');
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/admin/pricing']);
  }

  private loadItem(id: string): void {
    this.loading.set(true);
    this.pricingService.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue({
          systemProductId: item.systemProductId,
          systemProductName: item.systemProductName,
          vendPrice: item.vendPrice,
          productName: item.productName,
        });
        this.loading.set(false);
      },
      error: () => {
        this.pageError.set('Could not load this pricing item. It may have been removed.');
        this.loading.set(false);
      },
    });
  }
}
