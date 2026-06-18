# ETF 事实核查清单

Use this for ETF articles, ETF data updates, and ETF conclusion checks.

## Source Priority

1. ETF issuer official website.
2. Daily holdings CSV / JSON.
3. Daily NAV file.
4. Prospectus / summary prospectus / SEC filings.
5. Index provider methodology.
6. Exchange quote pages.
7. Nasdaq / Yahoo / Cboe quotes as cross-checks.

For current data, browse or use official APIs/pages. Do not rely on memory.

## Required Checks

- Fund name.
- Ticker.
- Issuer / adviser.
- Expense ratio.
- Inception / listing date.
- Exchange.
- Active vs index.
- Index name and methodology if index ETF.
- AUM / net assets.
- NAV.
- Market price.
- Latest quote if mentioned.
- Premium / discount.
- Median bid-ask spread if available.
- Holdings count.
- Top holdings and weights.
- Distribution frequency.
- Options availability if mentioned.
- Prospectus 80% policy if thematic ETF.

## Date Discipline

- Always write concrete dates.
- Do not mix NAV date with latest quote date.
- Do not mix holdings as-of date with ingestion / file date.
- For holdings files, inspect whether `holding_date` means trade date, next-day file date, or front-end displayed as-of date.
- If data sources disagree, state the source and choose official fund source for holdings / NAV.
- If a number is current only as of a previous trading day, say so.

## Article Presentation

Fact-check fully, but write cleanly:

- Keep source, date, core number, and judgment-relevant caveat.
- Avoid API debugging, field names, or source conflict details unless they change the investment interpretation.
- Do not insert review marks, warnings, or TODOs in publishable prose.

## Red Flags

- New ETF with no full-year performance.
- AUM changing quickly due to creation / redemption.
- Swaps, options, or total return swaps in holdings.
- Premium / discount unusually large.
- Bid-ask spread wide.
- Theme name narrower than actual holdings.
- Very concentrated top holdings.
- Distribution rate being confused with return.

## Output Requirements

When updating facts in an article:

- Update nearby explanatory text if the data change affects the conclusion.
- Remove old dates and stale values.
- Run a search for old values after editing.
- In the final response, summarize changed numbers and sources.
