# Report a Scam Helper — Accuracy & Release Audit
Date: October 29, 2026

## Public sources verified
- [Federal Trade Commission: what to do if scammed](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed) — payment-specific recovery, compromised credentials/devices and reporting
- [FTC official fraud report](https://reportfraud.ftc.gov/) — general reporting
- [FBI Internet Crime Complaint Center](https://www.ic3.gov/) — online/cyber-enabled crime, not an all-purpose offline incident complaint
- [FTC gift-card guidance](https://consumer.ftc.gov/avoiding-reporting-gift-card-scams) — card issuer contacts
- [IdentityTheft.gov](https://www.identitytheft.gov/) — identity theft and customized recovery steps
- [FTC unwanted text reporting](https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages) — 7726 (SPAM)
- [FCC consumer complaints](https://consumercomplaints.fcc.gov/hc/en-us) — unwanted-call complaints
- [SSA Office of Inspector General](https://oig.ssa.gov/) — Social Security impersonation
- [Treasury Inspector General for Tax Administration](https://www.tigta.gov/reportcrime-misconduct) — IRS/Treasury impersonation
- [USAGov state attorney general directory](https://www.usa.gov/state-attorney-general)
- [FTC free credit freeze guidance](https://consumer.ftc.gov/consumer-alerts/2025/01/freezing-maybe-freeze-your-credit-too)
- [GoatCounter privacy description](https://www.goatcounter.com/help/privacy) — aggregated visitor analytics; this site does not collect report answers

## Confirmed corrections
- Differentiate SSA, IRS/Treasury, Medicare, or other government impersonation; only include SSA/TIGTA reporting options when specifically selected
- Do not assume omitted disclosure equals no information exposed; explicit “did not share” option is distinct from leaving it blank
- Restrict password/reset and device-scan advice to exposed login/remote access
- Offer credit freezes specifically for identity theft/SSN exposure instead of every incident involving a financial loss
- Clarify that reversing crypto and other payments is not guaranteed, and that clipboard copy can be blocked
- Exclude IC3 for purely offline scenarios; include for online/cyber-enabled scams
- Validate exact monetary amounts, reject future dates and inverted start/end chronology
- Explain anonymous website analytics separately from untransmitted, device-local form answers
- Make the public homepage indexable with a canonical URL, while retaining a restrictive Content Security Policy and no-referrer header
- Preserve the four required-answer gates, inline error highlighting, donation positioning and all existing official link targets

## Release checks
- JavaScript syntax via `node --check app.js`
- Static source + content/privacy/canonical checks via `node scripts/verify-site.mjs`
- Real source-code DOM simulation and scenario matrix via `node scripts/verify-validation.mjs`
- Headless Chrome mobile workflow via `node scripts/verify-browser.mjs` in GitHub Actions

## Boundaries
This is a guidance and report-drafting tool, not an official government service. It does not submit reports, guarantee reimbursement, or replace financial, legal or law-enforcement advice. Not every agency can be verified as accepting every complaint type; visitors must follow instructions at each official destination. External sites and their forms can change after this review. An absolute 100% correctness claim is not supported.
