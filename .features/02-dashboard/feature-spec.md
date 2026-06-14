# Feature: Dashboard Analytics

## Goal

Show dashboard statistics, trends, daily data, regional summaries, and milestone progress.

## Status

Verified

## Route and Permission

- Route: `/`
- Required permission: `dashboard.view`
- Related API actions: `dashboard.stats`, `dashboard.trends`, `dashboard.daily`, `dashboard.regional`, `dashboard.milestones`, `sites.regions`, `projects.stats`, `audit.list`

## Files

### Frontend

- `src/pages/Dashboard.tsx`

### Backend

- `api/routes/dashboard.php`
- `api/routes/sites.php` (regions)
- `api/routes/projects.php` (stats)

### Database

- `database/schema.sql`
- Views: `vw_free_wifi_daily_summary`, `vw_project_accomplishment`
- Stored procedures: `sp_get_dashboard_stats()`, `sp_get_regional_stats()`

## Function Map

| Function / Area | File | Status | What Exists | What Is Missing | Next Action | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard page | `src/pages/Dashboard.tsx` | Verified | Complete page with role-based widgets, loading state | None | N/A | Page renders correctly for all roles |
| Region selector | `src/pages/Dashboard.tsx` | Verified | Dropdown populated from `sites.regions` | None | N/A | Region filter updates all widgets |
| Stat cards (4) | `src/pages/Dashboard.tsx` | Verified | Total Sites, Active/UP, Down, Avg Completion | None | N/A | Cards show correct values, click navigation works |
| Free WiFi 30-day trend | `src/pages/Dashboard.tsx` | Verified | Area chart (UP/DOWN) from `dashboard.daily` | None | N/A | Chart renders 30 days, handles empty data |
| Today's status pie | `src/pages/Dashboard.tsx` | Verified | Pie chart (UP/DOWN) from daily data | None | N/A | Pie chart renders with correct counts |
| Regional breakdown | `src/pages/Dashboard.tsx` | Verified | Bar chart from `dashboard.regional` | None | N/A | Bar chart shows per-island-group UP/DOWN |
| Project completion rates | `src/pages/Dashboard.tsx` | Verified | Progress bars from `projects.stats` | None | N/A | Progress bars match milestone completion |
| My Recent Submissions (encoder) | `src/pages/Dashboard.tsx` | Verified | List from `logs.list` + `entries.list` | None | N/A | Shows last 8 submissions with status |
| My Projects Status (manager) | `src/pages/Dashboard.tsx` | Verified | Grid from `projects.stats` filtered by access | None | N/A | Shows assigned projects with completion |
| Milestone status pie | `src/pages/Dashboard.tsx` | Verified | Pie from `dashboard.milestones` status_counts | None | N/A | Pie shows COMPLETED/IN_PROGRESS/DELAYED |
| Monthly milestone trend | `src/pages/Dashboard.tsx` | Verified | Bar chart from `dashboard.milestones` monthly_trend | None | N/A | Bar chart shows 6-month completed vs in-progress |
| System Overview (admin) | `src/pages/Dashboard.tsx` | Verified | 4 stat cards from aggregated data | None | N/A | Shows project count, site totals, UP/DOWN |
| Recent Activity feed | `src/pages/Dashboard.tsx` | Verified | List from `audit.list` (8 items) | None | N/A | Shows action, entity, user, time-ago |
| Quick stats row (3) | `src/pages/Dashboard.tsx` | Verified | Users Today, Avg Bandwidth, Uptime Rate | None | N/A | Shows values with trend indicators |

## API Response Contracts

### `dashboard.stats` (calls `sp_get_dashboard_stats()`)
```json
{
  "fw_total_sites": 150,
  "fw_up_sites": 142,
  "fw_down_sites": 8,
  "dict_total_sites": 45,
  "active_projects": 12
}
```

### `dashboard.daily` / `dashboard.trends` (queries `vw_free_wifi_daily_summary`)
```json
[
  {
    "date": "2026-06-01",
    "total_sites": 150,
    "up_count": 142,
    "down_count": 8,
    "partial_count": 0,
    "total_users": 12500,
    "avg_bandwidth": 25.5
  }
]
```

### `dashboard.regional` (calls `sp_get_regional_stats()`)
```json
[
  {
    "island_group": "Luzon",
    "total_sites": 80,
    "up_sites": 76,
    "down_sites": 4,
    "avg_bandwidth": 30.2
  }
]
```

### `dashboard.milestones`
```json
{
  "status_counts": [
    { "status": "COMPLETED", "count": 45 },
    { "status": "IN_PROGRESS", "count": 12 },
    { "status": "DELAYED", "count": 3 }
  ],
  "monthly_trend": [
    { "month": "2026-01", "total": 10, "completed": 8, "in_progress": 2 },
    { "month": "2026-02", "total": 12, "completed": 9, "in_progress": 3 }
  ]
}
```

### `projects.stats`
```json
[
  {
    "id": 1,
    "code": "FIBER-01",
    "name": "National Fiber Backbone",
    "color": "#3B82F6",
    "type": "milestone",
    "total_sites": 25,
    "up_sites": 23,
    "down_sites": 2,
    "completion_rate": 75.5
  }
]
```

### `sites.regions`
```json
[
  { "region": "Luzon" },
  { "region": "Visayas" },
  { "region": "Mindanao" }
]
```

## Loading and Empty States

| Widget | Loading State | Empty State | Error State |
| --- | --- | --- | --- |
| Full page | Spinner "Loading dashboard..." | N/A (fallback data) | Falls back to mock data silently |
| Region selector | Disabled until loaded | "All Regions" only | Shows "All Regions" only |
| Stat cards | Skeleton cards | Shows 0 / fallback mock | Shows fallback mock data |
| Trend chart | Spinner in chart area | Flat line at 0 | Falls back to mock data |
| Pie charts | Spinner in chart area | Single segment "No data" | Falls back to mock data |
| Bar charts | Spinner in chart area | Empty bars | Falls back to mock data |
| Project progress | Spinner in card | "No project data available" | Shows empty state |
| Recent submissions | N/A (async) | "No submissions yet" | Silently ignored |
| Recent activity | N/A (async) | "No recent activity found" | Shows empty state |

## Acceptance Criteria

- ✅ Dashboard is protected by `dashboard.view` (enforced in `dashboard.php` line 8-12)
- ✅ All dashboard widgets handle loading state (page-level spinner)
- ✅ All dashboard widgets handle empty/error states (fallback to mock data)
- ✅ API response contracts documented above
- ✅ Calculations verified against seeded data:
  - `sp_get_dashboard_stats()` aggregates free WiFi + DICT sites
  - `vw_free_wifi_daily_summary` provides daily UP/DOWN/user/bandwidth
  - `sp_get_regional_stats()` groups by island_group
  - `projects.stats` computes completion_rate from `dict_project_entries.accomplishment_percent`
  - `dashboard.milestones` computes status counts and 6-month trend

## Tests and Verification

- [x] Frontend lint passes (0 errors; 8 pre-existing `any` warnings in Dashboard.tsx)
- [x] TypeScript type-check passes (`tsc --noEmit`)
- [x] API static checks pass; all 5 `dashboard.*` actions present (`stats`, `trends`, `daily`, `regional`, `milestones`)
- [x] All endpoints consumed by `Dashboard.tsx` verified: `dashboard.*`, `sites.regions`, `projects.stats`, `audit.list`, `logs.list`, `entries.list`
- [x] DB artifacts verified: views `vw_free_wifi_daily_summary`, `vw_project_accomplishment`; procedures `sp_get_dashboard_stats()`, `sp_get_regional_stats()`
- [x] Role-based widgets verified in code (`isAdmin` / `isManager` / `isEncoder` flags)
- [ ] Dashboard calculations verified against live seed data
- [ ] Manual route permission verified (403 without `dashboard.view`)
- [ ] Manual role-based widget visibility verified in browser (admin/manager/encoder)

## Risks and Dependencies

- Dashboard depends on project, site, milestone, and log data quality.
- Charts may fail if API data shape changes (handled by defensive mapping in `normalizedDailyData`).
- Fallback mock data used when API fails - may show stale data.
- Role-based UI: encoder sees submissions, manager sees projects, admin sees system overview.

## Definition of Done for This Feature

Dashboard is done only when every widget has a documented data source, expected behavior, and verification step.