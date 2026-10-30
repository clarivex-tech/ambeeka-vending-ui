# Weekly Billing API Contract

The import and calculation routes below are confirmed by the API team. Other weekly review, correction, employer-rule, and workbook-download routes remain provisional.

## Routes

| Operation | Route | Status and expected result |
|---|---|---|
| Calculate and save preview | `POST /api/v1/admin/billing/calculations?month=YYYY-MM&employer={POS MachineName}` | **Confirmed.** Admin Bearer token; no request body. Returns the saved calculation ID and monthly/weekly results. Employer must exactly match imported POS `MachineName`. Each request creates a new snapshot and marks source imports as calculated/non-deletable. |
| Retrieve calculation preview | `GET /api/v1/admin/billing/calculations/{id}` | **Confirmed.** Admin Bearer token; returns saved monthly and weekly totals, calculated rows, unmatched rows, review status, and unconfirmed rules. |
| Import history | `GET /api/v1/admin/billing/imports?page=1&pageSize=20` | **Confirmed.** Admin Bearer token; returns `items`, `page`, `pageSize`, and `totalCount`; items are newest first. |
| Upload and validate workbook | `POST /api/v1/admin/billing/imports` | **Confirmed.** Admin Bearer token; multipart `file` with `.xlsx` up to 15 MB. `201` returns `id`, `fileName`, `status`, `transactionsImported`, `rowsWithoutProductName`, and `createdAt`; `400` returns validation issues; a duplicate returns `409` and existing import details. |
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
- The confirmed upload response does not include detected date range or unmatched-product details. The UI displays those only if a later API response includes them; calculation snapshots contain the authoritative unmatched rows.
- The exact server status that identifies a retained zero-settlement row. The UI currently recognizes `retained-zero-settlement` for styling and also renders a text label.
- Workbook filename and content type, if the API does not set `Content-Disposition`.
- Excel export is not currently included in the calculation API response or routes.
- Employer rule field metadata and effective-date/version behavior. Employer names and formulas are not hardcoded in the UI.
- Finalization behavior for unmatched products. The UI keeps unmatched products visible and does not make a finalization decision.

The UI must render totals and matching results from API responses only. It must not calculate invoice amounts or remove unmatched/zero-settlement transactions locally.
