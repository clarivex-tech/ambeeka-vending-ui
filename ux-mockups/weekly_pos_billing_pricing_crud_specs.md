# Weekly POS Billing and Pricing — Screen Specifications

Use this document with the responsive HTML mockups in the same folder. The mockups demonstrate layout and hierarchy; all example data is illustrative.

## Weekly POS flow

### 1. Upload

- Choose one `.xlsx` workbook, up to 15 MB.
- Show upload progress, then the `transactionsImported` count.
- Keep upload `ignoredRows` in their own section. Each item shows source row number, transaction ID when present, and reason. Treat `reasonCode` as nullable and use it for UI logic.
- On duplicate `409`, show the existing import name and offer to open/review using `existingImportId`. There is no overwrite action in the confirmed contract.
- Display row-level validation errors only when returned. Keep retry/reselect behavior clear for API errors.

### 2. Pricing review

- Review only the selected import using its pricing-review response.
- Show flagged source row, transaction ID, machine/time when present, source product details, reason, and suggested catalog products.
- Make the price basis and API warning visible: mapped rows currently use current catalog pricing; effective-dated historical pricing is unavailable.
- Map sends `sourceRowNumber`, action `Map`, and `productId`. Ignore sends `sourceRowNumber` and action `Ignore`.
- Decisions are pending until Calculate succeeds. Show decision feedback without calling a pending choice “saved.” Keep decisions intact after a failed request so the user can retry.
- A zero-issue response is a valid ready state and can continue to Calculate.

### 3. Weekly calculation

- Calculate is scoped to this import ID. Disable the button while the request is running.
- On success, show exactly one week using the returned `startDate` and `endDate`, and identify the result as a saved immutable snapshot.
- Keep imported transactions, calculation exclusions, and counted vends distinct. For example only: 226 imported − 7 excluded = 219 counted.
- Show excluded row details from `excludedRows`, including source row and transaction/product/price/free item/net price/settlement/reason values when available.
- For older snapshots where `excludedRows` is `null`, show the exclusion count and state that row details are unavailable.
- Render returned totals only. Do not calculate or imply commission, telemetry deductions, net remittance, final certification, or exports that are not part of the confirmed response/API.

## Pricing CRUD

The current pricing record contains `systemProductId`, `systemProductName`, `productName`, and `vendPrice`.

### Catalog list

- Show product name, system product ID/name, vend price, and available Edit/Delete actions.
- Include loading, API error, empty catalog, and no-search-results states.
- Keep the list usable on desktop and mobile; use a data table on wide screens and a responsive card or horizontally scrollable table on narrow screens.

### Create and edit

- Use the four current pricing fields only. Do not add tier, machine scope, effective date, notes, collision resolution, or auto-match confidence without a confirmed API/business rule.
- Required text fields follow the current limits: system product ID 64 characters; both names 255 characters.
- Vend price is USD, between $0.01 and $1,000,000.00, with two decimal places.
- Show inline validation and API errors. Preserve entered values if saving fails.

### Delete

- Confirm the product and price before calling the existing delete action. The current UI performs Delete; do not relabel it Retire or promise soft-delete behavior.

## Responsive and interaction guidance

- Mobile: stack panels and keep primary actions easy to reach. Use readable row cards or allow deliberate horizontal table scrolling for dense excluded details.
- Desktop: use the available width for side-by-side upload/review context, a readable pricing table, and a calculation summary beside exclusion details.
- Communicate state with text and iconography as well as color. Keep form labels, keyboard focus, disabled states, and error announcements clear.
