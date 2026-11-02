# Weekly Billing API Contract

The import-scoped weekly calculation and import routes below are confirmed by the API team. The previous month-wide calculation route is not used by the weekly Import & Processing flow; confirm whether it remains supported for future monthly workflows. Other weekly review, correction, employer-rule, and workbook-download routes remain provisional.

## Routes

| Operation | Route | Status and expected result |
|---|---|---|
| Review POS pricing rows for calculation scope | `GET /api/v1/admin/billing/pricing-review?month=YYYY-MM&employer={POS MachineName}` | **Confirmed.** Admin Bearer token; scans matching rows across all imports and returns review issues, product choices, transaction counts, current-price basis, and pricing warning. Does not save a calculation. |
| Review POS pricing rows in one import | `GET /api/v1/admin/billing/imports/{importId}/pricing-review` | **Confirmed.** Admin Bearer token; returns pricing issues and catalog choices for that import. Used to reopen a duplicate upload. |
| List saved calculations | `GET /api/v1/admin/billing/calculations?page=1&pageSize=20` | **Confirmed.** Admin Bearer token; paginated items include calculation IDs and display names. The UI uses the name as the option label and the ID as the value, then retrieves the selected snapshot. |
| Calculate one imported week | `POST /api/v1/admin/billing/imports/{importId}/calculations` | **Confirmed.** Admin Bearer token; request body may contain `calculationName` and `resolutions`. Resolutions are scoped to this import and contain `sourceRowNumber`, `action` (`Map` or `Ignore`), and `productId` for `Map`; `importId` is not repeated in each resolution. A successful request creates a new immutable snapshot without duplicating the import. The response includes `id`, `importId`, and exactly one `result.weeks` entry; its dates are the earliest and latest actual transaction dates in the workbook. The weekly result includes counted totals, `rowsExcludedForNonpositiveNetPrice`, and `excludedRows`. |
| Calculate and save month-wide preview | `POST /api/v1/admin/billing/calculations?month=YYYY-MM&employer={POS MachineName}` | **Legacy; retention to confirm.** Not used by the weekly Import & Processing flow. If retained, this route scans matching transactions across imported workbooks for the selected month and employer. |
| Retrieve calculation preview | `GET /api/v1/admin/billing/calculations/{id}` | **Confirmed.** Admin Bearer token; returns saved monthly and weekly totals, calculated rows, unmatched rows, review status, unconfirmed rules, applied resolutions, and ignored transactions. |
| Import history | `GET /api/v1/admin/billing/imports?page=1&pageSize=20` | **Confirmed.** Admin Bearer token; returns `items`, `page`, `pageSize`, and `totalCount`; items are newest first and include the display name and original file name. |
| Weekly billing dashboard | `GET /api/v1/admin/billing/dashboard` | **Confirmed.** Admin Bearer token; no query parameters. Returns all-time summary, weekly totals grouped by POS week, and the 10 most recent imports. Aggregates use only each import's latest single-week calculation; exact duplicate uploads do not create additional imports. Import and calculation statuses are separate; display calculation status when a snapshot exists, otherwise import status. |
| Retrieve saved import processing | `GET /api/v1/admin/billing/imports/{importId}/processing` | **Confirmed.** Admin Bearer token; returns import metadata, imported rows, ignored rows, current pricing review, latest saved calculation, and calculations. Saved resolutions are at `latestCalculation.result.appliedResolutions`; `ignoredRows` and older `excludedRows` may be null. |
| Upload and validate workbook | `POST /api/v1/admin/billing/imports` | **Confirmed.** Admin Bearer token; multipart `file` with `.xlsx` up to 15 MB and optional `displayName`. If omitted, it defaults to the filename without `.xlsx`. `201` returns `id`, `fileName`, `displayName`, `status`, `transactionsImported`, `ignoredRows`, `createdAt`, and `pricingReview`; each ignored row includes `rowNumber`, nullable `transactionId`, `reason`, and nullable `reasonCode`. `400` returns blocking workbook validation issues. A duplicate returns `409` with `existingImportId` and the existing display name; use that ID to retrieve the existing review. |
| Preview POS cleanup | `GET /api/v1/admin/billing/pos-cleanup/preview` | **Confirmed.** Admin Bearer token; returns the cleanup scope, confirmation phrase, counts to delete, and preserved record descriptions. |
| Execute POS cleanup | `POST /api/v1/admin/billing/pos-cleanup` | **Confirmed.** Admin Bearer token; JSON body `{ "confirmation": "RESET POS BILLING DATA" }`; returns deleted counts, preserved records, and completion time. |
| Workbook download | `GET /api/v1/admin/weekly-billing/weeks/{weekId}/workbook` | **Provisional.** Workbook bytes, authorized for Admin. Excel export is not part of the confirmed calculation API. |
| Weekly review | `GET /api/v1/admin/weekly-billing/weeks/{weekId}` | **Provisional.** Expected to return server-calculated rows, unmatched products, correction records, and editable-field definitions. |
| Create correction | `POST /api/v1/admin/weekly-billing/weeks/{weekId}/corrections` | **Provisional.** Backend should audit actor and change. |
| Edit correction | `PUT /api/v1/admin/weekly-billing/weeks/{weekId}/corrections/{correctionId}` | **Provisional.** |
| Delete correction | `DELETE /api/v1/admin/weekly-billing/weeks/{weekId}/corrections/{correctionId}` | **Provisional.** Backend should retain its audit record. |
| Full recalculation | `POST /api/v1/admin/weekly-billing/weeks/{weekId}/recalculate` | **Provisional.** Expected to refresh weekly and monthly totals. |
| Read employer rules | `GET /api/v1/admin/weekly-billing/employer-rules` | **Provisional.** Expected to return API-defined rule metadata and values. |
| Save employer rules | `PUT /api/v1/admin/weekly-billing/employer-rules/{employerId}` | **Provisional.** |

## Integration points to confirm

- Period boundary and timezone rules, including partial weeks at month boundaries.
- Correction fields, validation, required reason, and audit metadata. The current editor expects editable-field definitions from the API so it does not encode calculation rules.
- The exact shape of the `400` validation-issues body. The current UI expects an `issues` array containing strings or objects with `rowNumber` and `message`.
- Pricing review reasons are `MissingProductName`, `AliasNotFound`, `AmbiguousAlias`, and `InvalidPrice`. Map choices use the current catalog price; effective-date history is unavailable. The API returns `priceBasis: "CurrentCatalog"` and a warning, and calculations remain `NeedsReview` while pricing history is unavailable.
- Mapping and ignore decisions are held in the UI until a calculation succeeds. A `400` or `422` does not save them; the UI must preserve and resend the complete resolution list.
- Ignored transactions are excluded from price, settlement, and amount-due totals. Their original POS rows remain unchanged; the snapshot returns an `ignoredTransactions` list whose length is the ignored count.
- The weekly Import & Processing flow calculates only the uploaded `importId`. `transactionsImported`, upload `ignoredRows`, counted vends, and weekly `excludedRows` are distinct data; excluded transactions are not failed imports. `excludedRows: null` is valid for older saved calculations and means row details are unavailable.
- The confirmed upload response may include detected date range or unmatched-product details; calculation snapshots remain authoritative for calculation results and unmatched rows.
- The exact server status that identifies a retained zero-settlement row. The UI currently recognizes `retained-zero-settlement` for styling and also renders a text label.
- Workbook filename and content type, if the API does not set `Content-Disposition`.
- Excel export is not currently included in the calculation API response or routes.
- Employer rule field metadata and effective-date/version behavior. Employer names and formulas are not hardcoded in the UI.
- Finalization behavior for unmatched products. The UI keeps unmatched products visible and does not make a finalization decision.

The UI must render totals and matching results from API responses only. It must not calculate invoice amounts or remove unmatched/zero-settlement transactions locally.
