# Report a Scam Helper

Source recovered from the existing Netlify production deployment and updated with a focused four-step form.

## Deployment

This is a static website. Connect the **existing** `report-a-scam-helper` Netlify project to the repository `cbw29512/report-a-scam-helper` (do not create another Netlify site).

- Deploy branch: `main`
- Base directory: *(leave empty)*
- Build command: *(leave empty)*
- Publish directory: `.` (repository root)

Keep the previous successful Netlify deploy as the rollback point. Initial source recovery is on `main`; form improvements are in the `release/form-first-20261029` pull request.

## Flow

1. Answer the four questions.
2. Generate a customized list of official reporting destinations and a reusable report.
3. Copy/download/print the report; mark actions completed.
4. Only after the result is generated, reveal optional sharing, education, and one donation panel.

The top navigation has one small optional support link. The report and official links do not depend on donations.

Nothing in the app submits a report or persists user-entered answers. A separate anonymous site analytics script loads outside of the form logic.

## Checks

Run `node --check app.js` and `node scripts/verify-site.mjs` (no dependencies). Browser interaction checks should also be completed before final production publication.
