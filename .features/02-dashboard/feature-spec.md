# Feature: Dashboard Analytics

## Goal

Show dashboard statistics, trends, daily data, regional summaries, and milestone progress.

## Status

Draft

## Route and Permission

- Route: `/`
- Required permission: `dashboard.view`
- Related API actions: `dashboard.stats`, `dashboard.trends`, `dashboard.daily`, `dashboard.regional`, `dashboard.milestones`

## Files

### Frontend

- `src/pages/Dashboard.tsx`

### Backend

- `api/routes/dashboard.php`

### Database

- `database/schema.sql`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard page | `src/pages/Dashboard.tsx` | Draft | Page exists | Needs function-level spec | Document widgets and data sources | Each widget has defined source, loading, and error state |
| Stats | `api/routes/dashboard.php` | Draft | API action exists | Needs frontend/backend contract | Map expected response fields | Response fields match UI expectations |
| Trends | `api/routes/dashboard.php` | Draft | API action exists | Needs chart contract | Define chart format | Chart renders stable data |
| Daily data | `api/routes/dashboard.php` | Draft | API action exists | Needs aggregation contract | Define date grouping | Daily chart handles empty days |
| Regional data | `api/routes/dashboard.php` | Draft | API action exists | Needs region contract | Define region grouping | Region chart handles missing regions |
| Milestones | `api/routes/dashboard.php` | Draft | API action exists | Needs progress contract | Define milestone calculation | Milestone progress matches database state |

## Missing Work

- Build complete function map for every dashboard widget.
- Define loading and empty states.
- Confirm exact API response contracts.
- Add tests or manual verification for dashboard calculations.

## Next Planned Work

1. Inspect `Dashboard.tsx`.
2. Map each dashboard widget to API action and database fields.
3. Add missing acceptance criteria.

## Acceptance Criteria

- Dashboard is protected by `dashboard.view`.
- All dashboard widgets handle loading, empty, and error states.
- API response contracts are documented.
- Calculations are verified against seeded data.

## Tests and Verification

- [ ] Frontend lint passes
- [ ] API syntax/static checks pass
- [ ] Dashboard calculations verified
- [ ] Manual route permission verified

## Risks and Dependencies

- Dashboard depends on project, site, milestone, and log data quality.
- Charts may fail if API data shape changes.

## Definition of Done for This Feature

Dashboard is done only when every widget has a documented data source, expected behavior, and verification step.
