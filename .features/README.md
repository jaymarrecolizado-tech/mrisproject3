# Feature Spec Registry

This folder is the spec-driven feature control center for the project.

Each feature has its own numbered subfolder. Every feature folder must contain a `feature-spec.md` file with:

- feature goal
- current status
- route and permission
- frontend files
- backend API files
- database files
- function-level structure
- what is implemented
- what is missing
- next actions
- acceptance criteria
- tests and verification status

## Feature Lifecycle

| Status | Meaning |
| --- | --- |
| `Draft` | Feature folder exists, but function-level specs are incomplete. |
| `In Progress` | Implementation or investigation is active. |
| `Ready for Build` | Spec is complete and can be implemented one function at a time. |
| `Implemented` | Code exists, but verification is not complete. |
| `Verified` | Tests/lint/manual checks passed for the current scope. |
| `Done` | Feature is implemented, verified, documented, and accepted. |

## Definition of Done

A feature is not `Done` until:

- every function has a purpose and expected behavior
- missing work is listed explicitly
- acceptance criteria are written before implementation
- frontend and backend responsibilities are identified
- security/permission behavior is documented
- tests or manual verification steps are listed
- the feature can be built and reviewed one function at a time

## Current Features

| Folder | Feature | Status |
| --- | --- | --- |
| `01-authentication` | Authentication and session handling | Verified |
| `02-dashboard` | Dashboard analytics | Verified |
| `03-map` | Map and geospatial project view | Implemented |
| `04-free-wifi` | Free WiFi daily logs | Implemented |
| `05-projects` | DICT projects | Verified |
| `06-sites` | Sites and site management | Implemented |
| `07-photos` | Site photos | Implemented |
| `08-milestones` | Project milestones | Draft |
| `09-entries` | DICT project entries | Draft |
| `10-reports` | Report generation and downloads | In Progress |
| `11-users` | User management | Draft |
| `12-roles-permissions` | Roles and permissions | Draft |
| `13-audit-trail` | Audit trail | Draft |
| `14-notifications` | Notifications | Draft |
| `15-profile` | User profile | Draft |
| `16-schema-spec` | Schema specification view | Draft |
