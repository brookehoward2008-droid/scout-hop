# HopScout / Block Explorer

Regional transit and youth discovery prototype for King and Snohomish counties.
The existing Google Maps, Leaflet fallback, route planner, Firebase sign-in and
GeoScout features remain part of the app.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Google Maps and Gemini keys are optional for
starting the app: Leaflet works without a Google key, while AI insights require
the existing Gemini integration. Copy `.env.example` to `.env` for configuration.
Only browser-restricted Google Maps keys belong in `VITE_` variables. Private
server keys and the ingestion token must never be committed.

```sh
npm run lint
npm test
npm run build
npm start
```

`npm start` serves the compiled frontend and backend together, including API
routes. `npm run preview` previews the frontend only. On macOS/Linux,
`bash deploy.sh` installs, tests, builds and starts the local production server.
It does not publish a hosted deployment. Set `PORT` if 3000 is occupied.

## Youth discoveries

- The original directory is retained as **sample listings**. Its facilities,
  fees, dates and availability are unverified and must not be used as travel advice.
- With no ingested source items, the finder displays those labeled samples.
  Once source items exist, the finder searches those items instead.
- No AI-generated events are added to discovery results. The old generator could
  produce realistic-looking addresses and unverified free-admission claims.
- RSS publication dates are not event dates. Items without explicit coordinates
  appear in search, with the map action disabled. Coordinates are never invented.
- Source text may report free admission; this is labeled as a source claim,
  not independent verification. Conflicting fee text keeps the cost unknown.
- All filters apply to every discovery result. “Advertised Free Events” requires
  an explicit free-admission claim in the source text.

Set `HOPSCOUT_FEEDS` to a JSON array of reviewed RSS/Atom sources. Each entry must
include `name`, an HTTPS `url`, `county` (`king` or `snohomish`), and `city`.
The server polls configured sources at startup and every 15 minutes. The old
Sno-Isle webpage and county JSON dataset are not assumed to be RSS feeds.
Failed sources are logged without deleting the last collected items.

The default persistent store is `data/youth-events.json`, excluded from git.
Use `HOPSCOUT_DATA_FILE` to point to persistent storage on your host. The store
retains up to 2,000 discoveries and supports a single server process. If an old
PostgreSQL database is configured through `SQL_HOST`, the server attempts to
import its records without changing the original database.

For the optional standalone collector, set a private `HOPSCOUT_INGEST_TOKEN` on
both the collector and server, then run `npm run scrape`. The batch endpoint
requires that token and validates all records. Built-in polling does not need a
token. `API_INGEST_URL` can select another server.

Discovery endpoints:

- `POST /api/youth-events/search`: `{ "query": "", "county": "all", "category": "all", "city": "" }`
- `GET /api/youth-events/db`: collected source items
- `GET /api/places/nearby`: collected items with source-provided coordinates;
  geographic radius filtering is not implemented
- `POST /api/youth-events/batch`: authenticated ingestion of `{ "events": [...] }`

Live organizer feeds, provider credentials, public deployment and real transit
arrival accuracy require separate validation. The automated tests use local
fixtures and do not send data to Firebase or paid APIs.
