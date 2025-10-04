This folder contains placeholders for API routes that were removed from `app/api/` during cleanup.

These files are placeholders (not the original source) to record which endpoints were removed.
If you need the original implementation, restore from git history (checkout a commit before this cleanup) or request a more complete archival.

Kept API routes in `app/api/` (not archived here):
- update-fixtures
- odds/update
- betting/calculate
- betting/sequences
- check-data
- import-historical
- games
- check-game-status
- migrate-game
- set-odds
- edit-odds

Cleanup performed by automated assistant to avoid build-time imports from debug/test endpoints.
This folder holds archived API routes moved out of `app/api` so they won't be compiled by Next.js during builds.

Do not deploy this folder; it's only for backup and reference.
