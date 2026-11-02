# Weekly POS Billing — Interaction States

This is the current UX reference for the weekly import flow. The linked HTML mockups in this folder are illustrative; transaction names and values are sample data.

## Scope and terms

- A calculation is scoped to one uploaded `.xlsx` workbook (up to 15 MB). The calculation week is based on the earliest and latest transaction dates in that workbook.
- Keep these counts separate: `transactionsImported`, upload `ignoredRows`, calculation exclusions, and counted vends. Example only: 226 imported, 7 excluded, 219 counted.
- Upload ignored rows are reported separately from transactions excluded by the calculation rule. Show ignored row number, nullable transaction ID, reason, and nullable `reasonCode`.
- The current calculation exclusion reason is `NonpositiveNetPrice`. Render row details when `excludedRows` is provided. For older calculations where it is `null`, show the count and say details are unavailable.
- A successful Calculate request creates a new immutable snapshot. A failure must leave the user's pending pricing decisions available for retry.

## State matrix

| State | What the user sees | Actions and behavior |
|---|---|---|
| Empty | A clear prompt to choose a weekly Excel workbook. State `.xlsx` and 15 MB limit. | Select a workbook and upload. Do not show a cycle selector or promise CSV support. |
| Uploading / loading | Selected file name and progress or loading indicator. | Prevent accidental duplicate upload submissions while the request is active. |
| Upload success | `transactionsImported` count and a separate ignored rows section. | Continue to pricing review. Show ignored row number, optional transaction ID, and reason. |
| Validation error | API validation messages, with row details only when returned by the API. | Keep the selected file available where possible; allow the user to choose a corrected workbook. Do not promise an error report unless the API provides one. |
| Duplicate workbook | Explain that the workbook already exists and show the existing import name when available. | A `409` response includes `existingImportId`; offer to open/review that import. Do not offer overwrite unless a supported overwrite operation is added. |
| API error | Plain-language failure message with a retry action. | Preserve the current import context and unsent review decisions. |
| Pricing review | Issues for this import, source row and transaction details, reason, suggested catalog products, and current catalog price basis/warning. | Map with a selected `productId` or Ignore using the source row number. Avoid confidence scores or automated-match claims unless supplied by the API. |
| No rows need review | A positive, neutral ready state. | Allow Calculate; do not treat this as an error or require a decision. |
| Calculation in progress | Clear progress feedback and disabled Calculate button. | Prevent a second request while the first is running. |
| Completed calculation | One weekly result, saved snapshot status, imported/excluded/counted totals, and available excluded-row details. | Keep the snapshot read-only. A later Calculate creates a new snapshot. |

## Calculation result fields

Use the dates and totals returned in the one `result.weeks[]` entry. Excluded row details may include transaction ID, settlement time, source product, price, free item, net price, settlement, reason, and source row. Render only values present in the response; do not derive commission, deductions, remittance, audit hashes, or export actions in the UI without a confirmed field or endpoint.
