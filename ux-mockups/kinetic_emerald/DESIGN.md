# Weekly Billing UI Direction

## Visual tokens

- Primary teal: `#00685F`.
- Dark teal for hover/pressed states: `#00524C`.
- Pale teal for selected/soft backgrounds: `#E5F5F2`.
- Use neutral white surfaces, a cool light gray canvas, slate text, and restrained borders.
- Keep success, warning, and error colors distinct from the brand teal. Never rely on color alone to communicate status.
- Use the app's system sans-serif stack for body and headings; use a monospace face only for IDs or transaction codes. This keeps the screens readable and avoids loading several competing font families.

## PrimeNG and layout

- Map the primary teal and semantic colors into PrimeNG Aura design tokens when implementing in Angular. Use PrimeIcons so the mockups align with the app component system.
- Mobile uses a single-column flow; desktop reflows upload/review panels side by side, preserves a readable pricing table, and places calculation metrics beside excluded-row details.
- Use consistent card padding, 8–14 px corner radii, visible focus outlines, and clear hover/disabled states. Keep interaction animation subtle and optional.

This is an administrative billing interface. Prioritize quick scanning, clear accounting categories, and confidence in saved results over vending-machine imagery or telemetry decoration.
