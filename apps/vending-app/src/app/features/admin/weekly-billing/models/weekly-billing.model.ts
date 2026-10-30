export interface BillingPeriod {
  id: string;
  startDate: string;
  endDate: string;
  totalDue: number;
  vendCount: number;
  workbookAvailable: boolean;
}

export interface BillingMonthOverview {
  month: string;
  monthlyTotalDue: number;
  monthlyVendCount: number;
  periods: BillingPeriod[];
}

export interface UnmatchedProduct {
  productName: string;
  transactionCount: number;
}

export interface WorkbookImportResult {
  id?: string;
  /** Kept for compatibility with the original upload response contract. */
  importId?: string;
  fileName?: string;
  status?: string;
  transactionsImported?: number;
  rowsWithoutProductName?: number;
  createdAt?: string;
  rowCounts?: Record<string, number>;
  detectedStartDate?: string | null;
  detectedEndDate?: string | null;
  blankProductRows?: number;
  unmatchedProducts?: UnmatchedProduct[];
}

export interface WorkbookImportHistoryItem {
  id: string;
  fileName: string;
  status: string;
  transactionsImported: number;
  rowsWithoutProductName: number;
  createdAt: string;
}

export interface WorkbookImportHistoryPage {
  items: WorkbookImportHistoryItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface PosBillingCleanupCounts {
  calculations: number;
  calculationImportLinks: number;
  imports: number;
  transactions: number;
}

export interface PosBillingCleanupPreview {
  scope?: string | null;
  confirmationPhrase?: string | null;
  recordsToDelete: PosBillingCleanupCounts;
  recordsPreserved?: string[] | null;
}

export interface PosBillingCleanupResult {
  deleted: PosBillingCleanupCounts;
  preserved?: string[] | null;
  completedAt: string;
}

export interface BillingTotals {
  totalVends: number;
  price: number;
  freeItems: number;
  netPrice: number;
  employeeSettlement: number;
  amountDue: number | null;
}

export interface CalculatedBillingRow {
  transactionId: string;
  machineSettlementTime: string;
  sourceProductName: string;
  productName: string;
  price: number;
  freeItem: number;
  netPrice: number;
  settlement: number;
  highlightForReview: boolean;
  sourceImportId: string | null;
  sourceRowNumber: number | null;
}

export interface UnmatchedBillingRow {
  transactionId: string;
  machineSettlementTime: string;
  sourceProductName: string;
  settlement: number;
  reason: 'AliasNotFound' | 'NoEffectivePrice' | 'AmbiguousEffectivePrice';
}

export interface WeeklyCalculationResult {
  startDate: string;
  endDate: string;
  rows: CalculatedBillingRow[];
  unmatchedRows: UnmatchedBillingRow[];
  rowsExcludedForNonpositiveNetPrice: number;
  totals: BillingTotals;
}

export interface BillingCalculationResult {
  year: number;
  month: number;
  weeks: WeeklyCalculationResult[];
  rowsWithoutProductName: number;
  totals: BillingTotals;
  canFinalize: boolean;
  unconfirmedRules: string[];
}

export type BillingCalculationStatus = 'NeedsReview' | 'ReadyForReview';

export interface BillingCalculationResponse {
  id: string;
  employerName: string;
  status: BillingCalculationStatus;
  createdAt: string;
  result: BillingCalculationResult;
}

export type WorkbookValidationIssue = string | { rowNumber?: number; code?: string; message: string };

export interface BillingTransaction {
  id: string;
  transactionId: string;
  settlementTime: string;
  product: string;
  price: number;
  freeItem: boolean;
  netPrice: number;
  settlement: number;
  highlightStatus: string | null;
}

export type EditableFieldType = 'text' | 'number' | 'boolean';

export interface EditableFieldDefinition {
  key: string;
  label: string;
  type: EditableFieldType;
  required: boolean;
  options?: string[];
}

export interface ManualCorrection {
  id: string;
  transactionId: string;
  reason: string;
  changes: Record<string, string | number | boolean>;
  updatedAt: string;
}

export interface WeeklyReview {
  period: BillingPeriod;
  monthlyTotalDue: number;
  monthlyVendCount: number;
  transactions: BillingTransaction[];
  unmatchedProducts: UnmatchedProduct[];
  correctionFields: EditableFieldDefinition[];
  corrections: ManualCorrection[];
}

export type EmployerRuleFieldType = 'text' | 'number' | 'boolean' | 'select';

export interface EmployerRuleField {
  key: string;
  label: string;
  type: EmployerRuleFieldType;
  value: string | number | boolean;
  options?: string[];
}

export interface EmployerRuleSet {
  employerId: string;
  employerName: string;
  fields: EmployerRuleField[];
  updatedAt: string;
}
