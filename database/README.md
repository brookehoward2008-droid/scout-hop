# HopScout database setup

Node.js 22.9+ required. Includes all 39 Washington county names and **40 sourced facilities covering every county**. Read STATEWIDE-SOURCES.md and VERIFICATION.md for the scope of the source review. This is a database package, not an API or deployed application.

## Run locally — no Docker, Docker Hub or server account

From this directory in PowerShell:

```powershell
npm.cmd ci
npm.cmd run local:setup
npm.cmd run local:status
npm.cmd test
```

This path uses PGlite, a PostgreSQL engine embedded in Node.js, already included in the package. Data persists in `.local/hopscout/`, resolved relative to the package directory. It needs no DATABASE_URL, .env, Docker installation, Docker Hub account, PostgreSQL service or paid account. Internet is needed for the initial npm dependency download. Setup and status close the engine after use. Use one process at a time against this directory; this path is intended for local development and inspection. It does not start a PostgreSQL network server and cannot accept a `pg` connection string. A future local application can use the exported `embeddedClient` adapter in the same Node.js process. Keep the engine's data folder intact; back it up only after the process has closed.

The original compose.yaml is retained as an optional server configuration, not a prerequisite.

## Optional: an existing PostgreSQL server

Copy `.env.example` to `.env`, set DATABASE_URL to your existing database, then run `npm.cmd run setup`. The database must already exist and the role must be able to create a schema/tables. No superuser or PostGIS extension is required. For a remote database, configure TLS through your provider's documented connection options; the script does not disable certificate validation.

Setup runs only when explicitly invoked, executes a transaction, upserts bundled county/facility facts, and exits nonzero on failure. Server mode uses a PostgreSQL advisory lock; embedded mode skips that lock because it has a single connection. Both modes parameterize seed values. The lockfile pins installed dependencies. After a database version newer than 1 exists, setup refuses to proceed. Future structural changes require a new migration; CREATE TABLE IF NOT EXISTS does not repair schema drift.

## Tables and queries

Tables live under `hopscout`, e.g. `SELECT * FROM hopscout.counties ORDER BY name;`. Always qualify table names (or configure your application's search_path).

```sql
SELECT c.name, count(l.id) AS verified_facilities
FROM hopscout.counties c
LEFT JOIN hopscout.youth_locations l ON l.county = c.name
GROUP BY c.name ORDER BY c.name;

SELECT name, address, is_free, source_url, verified_on
FROM hopscout.youth_locations WHERE county = 'Snohomish';
```

Unknown `is_free` is NULL; filter genuinely verified free results with `is_free IS TRUE`. Do not coalesce unknown to true. Retained facilities are not certified teen drop-in programs. Events and geocaches start empty. A geocache requires a source and permission reference, with pending review as the default. ZIP-to-county mapping is many-to-many and empty pending an authoritative import. Facility ZIPs are not ZIP centroids.

Coordinates are deliberately NULL until sourced. A paired-coordinate constraint requires provenance before mapping. Spatial search is deferred, so this setup does not claim geospatial functionality merely because an extension is installed.

## Existing prototype databases

This package deliberately uses a new dedicated schema. It does not delete, correct, or expose existing `public.youth_locations` or `public.geocaches` rows. Point the application at `hopscout.*` and stop using the old prototype data. Back up and review an existing deployment before a separate migration/removal of its old rows. Rerunning this package refreshes bundled identity/address fields but preserves separately added optional details; these require their own verification. No existing PostgreSQL server was accessed; only a new package-local embedded database was created.

## Validation and operation

`npm.cmd test` runs the SQL and seeding against PGlite. It tests repeatability, unique IDs, facility coverage of all 39 counties, empty unsupported inventories, unknown fields, constraints and complete rollback after an injected seed failure. The same embedded adapter is used by tests and local mode. Local setup and a separate status process were also executed against the persistent database. These checks do not verify the network `pg` transport, multi-client locking, Docker startup or a remote deployment.

The statewide expansion adds 35 public libraries to the original five facilities. Youth-friendly selection is an editorial inference from public library use for reading/learning, supported by operator/government facility sources. It is not verification of teen-only spaces, a staffed youth drop-in service, or permission for an unaccompanied child. No hours, prices, age ranges, coordinates, emails or transit routes are inferred. Official pages can change; check the linked operator before traveling.

The schema includes prototype user/progression and moderated submission tables without sample personal data. Authentication, API authorization, grants and submission approval logic belong in the application; do not expose this database directly to a browser. No ORCA integration is implemented by the boolean profile field.
