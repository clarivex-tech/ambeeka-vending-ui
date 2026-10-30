import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import {
  BILLING_CALCULATIONS_API_PATH,
  BILLING_IMPORTS_API_PATH,
  BILLING_POS_CLEANUP_API_PATH,
  WEEKLY_BILLING_API_PATH,
} from '../constants/weekly-billing.constants';
import {
  BillingCalculationResponse,
  EmployerRuleSet,
  ManualCorrection,
  PosBillingCleanupPreview,
  PosBillingCleanupResult,
  WeeklyReview,
  WorkbookImportHistoryPage,
  WorkbookImportResult,
} from '../models/weekly-billing.model';

@Injectable({ providedIn: 'root' })
export class WeeklyBillingService {
  private readonly api = inject(ApiService);

  createCalculationPreview(month: string, employer: string): Observable<BillingCalculationResponse> {
    const query = `month=${encodeURIComponent(month)}&employer=${encodeURIComponent(employer)}`;
    return this.api.postNoBody<BillingCalculationResponse>(`${BILLING_CALCULATIONS_API_PATH}?${query}`);
  }

  getCalculationPreview(calculationId: string): Observable<BillingCalculationResponse> {
    return this.api.get<BillingCalculationResponse>(
      `${BILLING_CALCULATIONS_API_PATH}/${encodeURIComponent(calculationId)}`,
    );
  }

  downloadWorkbook(weekId: string): Observable<Blob> {
    return this.api.getBlob(`${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}/workbook`);
  }

  validateWorkbook(file: File): Observable<WorkbookImportResult> {
    const body = new FormData();
    body.append('file', file);
    return this.api.post<WorkbookImportResult>(BILLING_IMPORTS_API_PATH, body);
  }

  getImportHistory(page: number, pageSize: number): Observable<WorkbookImportHistoryPage> {
    return this.api.get<WorkbookImportHistoryPage>(BILLING_IMPORTS_API_PATH, {
      page: String(page),
      pageSize: String(pageSize),
    });
  }

  deleteImport(importId: string): Observable<void> {
    return this.api.delete<void>(`${BILLING_IMPORTS_API_PATH}/${encodeURIComponent(importId)}`);
  }

  getPosBillingCleanupPreview(): Observable<PosBillingCleanupPreview> {
    return this.api.get<PosBillingCleanupPreview>(`${BILLING_POS_CLEANUP_API_PATH}/preview`);
  }

  cleanPosBillingData(confirmation: string): Observable<PosBillingCleanupResult> {
    return this.api.post<PosBillingCleanupResult>(BILLING_POS_CLEANUP_API_PATH, { confirmation });
  }

  getWeeklyReview(weekId: string): Observable<WeeklyReview> {
    return this.api.get<WeeklyReview>(`${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}`);
  }

  createCorrection(weekId: string, correction: Pick<ManualCorrection, 'transactionId' | 'reason' | 'changes'>): Observable<ManualCorrection> {
    return this.api.post<ManualCorrection>(
      `${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}/corrections`,
      correction,
    );
  }

  updateCorrection(weekId: string, correctionId: string, correction: Pick<ManualCorrection, 'transactionId' | 'reason' | 'changes'>): Observable<ManualCorrection> {
    return this.api.put<ManualCorrection>(
      `${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}/corrections/${encodeURIComponent(correctionId)}`,
      correction,
    );
  }

  deleteCorrection(weekId: string, correctionId: string): Observable<void> {
    return this.api.delete<void>(
      `${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}/corrections/${encodeURIComponent(correctionId)}`,
    );
  }

  recalculateWeek(weekId: string): Observable<WeeklyReview> {
    return this.api.post<WeeklyReview>(
      `${WEEKLY_BILLING_API_PATH}/weeks/${encodeURIComponent(weekId)}/recalculate`,
      {},
    );
  }

  getEmployerRules(): Observable<EmployerRuleSet[]> {
    return this.api.get<EmployerRuleSet[]>(`${WEEKLY_BILLING_API_PATH}/employer-rules`);
  }

  saveEmployerRules(ruleSet: EmployerRuleSet): Observable<EmployerRuleSet> {
    return this.api.put<EmployerRuleSet>(
      `${WEEKLY_BILLING_API_PATH}/employer-rules/${encodeURIComponent(ruleSet.employerId)}`,
      { fields: ruleSet.fields },
    );
  }
}
