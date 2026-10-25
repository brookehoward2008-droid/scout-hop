# HopScout

The app serves 40 sourced facilities across all 39 Washington counties from persistent embedded PostgreSQL (PGlite). No Docker, Docker Hub, database service or paid database account is required.

## Run locally

Requires Node.js 22.9+. From the repository root in PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:3000 and open Youth-Friendly Places. Startup initializes/upserts the reviewed seed automatically. County/category/search filters query SQL on each request. Google Maps/Gemini keys remain optional for directory use; existing maps, transit and sign-in features retain their own configuration.

Default database: `database/.local/hopscout`. To use Brooke's previously prepared database, create a local `.env`:

```dotenv
HOPSCOUT_DB_DIR=C:/Users/brook/hopscout-database/.local/hopscout
PORT=3000
```

That is the configuration used in this local checkout. Git ignores .env, runtime databases and dependencies. Use one process at a time per embedded database directory. Stop the app before standalone database commands or backups. The engine runs in-process and has no network connection string.

## Data boundaries

See [all facilities and official sources](database/STATEWIDE-SOURCES.md) and [verification notes](database/VERIFICATION.md). Verification covers identity/address. Public libraries are an editorial selection of general youth-friendly reading/learning places, not certification of teen-only rooms, supervision or current programs.

Unknown fees, ages, schedules, transit and coordinates remain null. The finder hides empty detail rows and does not invent XP. Map actions are disabled without verified coordinates. The nearby endpoint excludes unlocated facilities.

The previous sample directory, feed store, legacy SQL import and automatic polling are not used by the app. Batch ingestion is disabled. Events/geocaches endpoints return empty inventories. Fictional bundled caches and loading of unreviewed cloud/browser caches are disabled; legacy browser data is preserved. Cache creation is unavailable pending a reviewed placement workflow.

## Checks and production

```powershell
npm.cmd test
node --test database/setup.test.mjs
npm.cmd run build
npm.cmd start
```

Start commands from the repository root. Keep the checked-in database directory alongside dist and installed dependencies: the production server uses its schema and seed files. The server binds to localhost. No public deployment is performed. External maps, Firebase and transit services are separate from directory database verification.
