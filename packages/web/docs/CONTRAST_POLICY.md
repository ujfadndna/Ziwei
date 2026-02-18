# Contrast Policy (Enforced)

This project enforces the following contrast thresholds:

- Body text / input value / key data: **>= 4.5:1**
- Heading (>= 18px regular or >= 14px bold): **>= 3:1**
- Secondary text (label / hint / secondary table header): **>= 3:1**
- Disabled text: **>= 3:1**

Implementation rules:

1. Surface-specific tokens are mandatory:
   - `--text-on-dark`, `--muted-on-dark`
   - `--text-on-light`, `--muted-on-light`
   - plus input value / placeholder / disabled tokens per surface
2. Do not weaken readability using `opacity` on text.
3. Text must not sit directly on complex backgrounds; use cards, pills, or scrim.
4. Hover/selected states must not reduce contrast.
5. Every release runs contrast audit:
   - `pnpm --filter @ziwei/web audit:contrast`

If audit fails, tokens/styles must be fixed before shipping.
