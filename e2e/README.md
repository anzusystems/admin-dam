# E2E Tests — ADAM

Playwright-based end-to-end tests for the Admin DAM.

---

## Prerequisites

- **Node.js** `^22.22.2`, `^24.15.0` or `>=26.0.0`
- **Yarn** — the e2e package pins its own version (`packageManager` in `e2e/package.json`), corepack picks it up
- **WARP Client** — required for accessing devel/staging environments ([setup guide](https://dev.azure.com/petitpress/DevOps/_wiki/wikis/DevOps.wiki/3100/Zero-Trust-Setup))

---

## Setup

### 1. Install dependencies

```bash
cd e2e
yarn install
```

### 2. Install Playwright browsers

```bash
yarn playwright install chromium
```

> On Linux or CI, also install system dependencies: `yarn playwright install --with-deps chromium`

### 3. Configure environment

Copy the template and fill in credentials (available in BitWarden under `Playwright Config - DAM`):

```bash
cp .env.dist .env.devel     # for devel
cp .env.dist .env.staging   # for staging
cp .env.dist .env.local     # for the app running locally in Docker
```

Required variables:

```bash
BASE_URL=https://admin-dam.smedevel.sk
FORCE_LOGIN_URL=https://core-dam.smedevel.sk/force/login/adm/<user id>
ADMIN_USER_ID=
URL_DOMAIN=smedevel.sk
URL_PROTO=https
LICENCE_ID=100000
```

Optional:

```bash
FORCE_LOGIN_USER_IDS=    # one account per worker, see "Parallel workers" below
HOST_RESOLVER_RULES=     # local only
```

The active environment is controlled by `ADAM_ENV` (default: `devel`). The config loader reads `.env.${ADAM_ENV}`
automatically.

| `ADAM_ENV` | Env file       | Target                            |
| ---------- | -------------- | --------------------------------- |
| `devel`    | `.env.devel`   | `https://admin-dam.smedevel.sk`   |
| `staging`  | `.env.staging` | `https://admin-dam.smestaging.sk` |
| `local`    | `.env.local`   | the app in this Docker stack      |

### Media fixtures

The upload tests use sample images, audio, video and documents. They are too large for git, so `globalSetup`
downloads any that are missing from the `anzu-e2e-test-data-devel-bel` bucket into `e2e/fixtures/` (gitignored)
before the first test runs. The list lives in `pages/shared/fixtures.ts`.

---

## What every spec starts with

`prepareUser(page)` (`pages/shared/login.ts`) runs in each spec's `beforeAll`:

1. force-login through core-dam,
2. Slovak language and dark theme (`localStorage`),
3. **"DEBUG: Zobraziť nevydané funkcie"** switched on in `/settings`, so merged-but-hidden features are covered,
4. the licence from `LICENCE_ID` selected through the header licence dialog,
5. clipboard permissions for the context.

Selectors and assertions therefore expect Slovak texts.

---

## Running tests

| Command                 | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `yarn test:open`        | Playwright UI mode (interactive, great for development) |
| `yarn test:run`         | Headless run against devel (default)                    |
| `yarn test:run:devel`   | Headless run, explicitly devel                          |
| `yarn test:run:staging` | Headless run against staging                            |
| `yarn test:run:local`   | Headless run against the local Docker app               |

```bash
yarn test:run tests/settings/author.spec.ts
yarn test:run tests/upload/
yarn test:run --grep "Author"
```

Describe titles are prefixed with the target environment — `ADMIN-DAM (DEV|STG|LOCAL) - <Subject>`.

### Tags

A small, closed vocabulary; most specs carry no tag. Select a feature by path rather than by tag.

| Tag            | Meaning                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `@smoke`       | Quick sanity subset                                                                                  |
| `@integration` | Crosses into other systems (admin-cms, image servers) and needs them reachable                       |
| `@destructive` | Deletes data it did not create (e.g. an RSS-imported podcast episode) — skip where that data matters |

```bash
yarn test:run --grep @smoke
yarn test:run --grep-invert "@destructive|@integration"
```

---

## Running tests via `bin/test`

`bin/test` (repo root) works in both Docker and non-Docker environments: outside Docker it delegates to the
application container, inside it installs dependencies and runs the tests directly. It runs the vitest suite first
(`src/test`, no environment or browser needed) and then Playwright; `--unit` or `--e2e` picks one, and it exits
non-zero when either suite failed.

| Flag                        | Description                                          | Default |
| --------------------------- | ---------------------------------------------------- | ------- |
| `--unit` / `--e2e`          | Run only vitest / only Playwright                    | both    |
| `-e, --env <env>`           | Target environment (`local` \| `devel` \| `staging`) | `devel` |
| `-f, --filter <pattern>`    | Grep pattern for test names or tags (e.g. `@smoke`)  | —       |
| `-i, --filter-invert <pat>` | Skip tests matching the pattern                      | —       |
| `--spec <path>`             | Test file or glob pattern                            | —       |
| `--headed`                  | Run with a visible browser window                    | —       |
| `--ui`                      | Open Playwright UI mode                              | —       |
| `--no-install`              | Skip `yarn install`                                  | —       |
| `-- <args>`                 | Pass remaining args directly to Playwright           | —       |

```bash
bin/test --e2e -f @smoke
bin/test --e2e -i "@destructive|@integration"
bin/test --spec tests/settings/author.spec.ts
bin/test --unit
bin/test -e staging -- --retries=0
```

### Parallel workers

Every spec switches the licence of the account it runs as, and the licence is stored per user. Two workers sharing
one account would switch each other's licence mid-test, so the config runs **one worker** unless
`FORCE_LOGIN_USER_IDS` lists more accounts (up to two workers). Each id in that comma-separated pool is taken by one
worker slot and swapped into `FORCE_LOGIN_URL`; every account must be a DAM super admin with the same permissions.

---

## Code quality

```bash
yarn lint:tsc       # TypeScript type checking only
yarn ci             # lint:tsc + format:check + lint:oxlint (also `yarn lint`)
yarn lint:fix       # auto-fix lint and formatting issues
```

---

## Project structure

```
e2e/
├── pages/              # Page objects: selectors, actions and interfaces as plain functions
│   ├── shared/         # login, licence, admin (loaders, alerts, filters), crud, datatable, upload, api,
│   │                   # errors (no-write assertions, response stubs), fixtures, constants
│   ├── settings/
│   ├── assets/
│   └── ...             # One folder per feature area
├── tests/              # Specs (*.spec.ts), one folder per admin section
├── setup/
│   └── globalSetup.ts  # Validates env vars and downloads media fixtures
├── fixtures/           # Downloaded media (gitignored)
├── playwright.config.ts
├── tsconfig.json       # Project references root (delegates to pages/, tests/ and setup)
└── .env.dist           # Environment variable template
```

All tests in a suite share one browser page via `test.describe.serial` + `beforeAll`/`afterAll`. The `@pages/*`
path alias resolves to `./pages/*`.

### Things worth knowing about the app

- Many `data-cy` attributes exist twice (navigation rail + drawer, one per datatable row) — use `visibleCy()`.
- Edit forms render before their record is fetched, and the fetched values overwrite anything typed earlier — wait
  for a field to hold its loaded value before editing.
- Created ids come from the create request's response (`confirmCreate`, `uploadFile`), never from list order.
- Uploading a file identical to an existing asset marks the new file `duplicate` — even right after the original
  was deleted.
- Drag-and-drop uploads go through the Chrome DevTools protocol (`uploadFiles(page, files, 'drag-drop')`): the app
  reads dropped files via `webkitGetAsEntry()`, which is null for a DataTransfer built in page script.
- Some records cannot be deleted (asset licences, podcasts, distribution categories, users), so runs leave them
  behind with `RAND_NUM`-suffixed names.

---

## Test artifacts

| Path        | Contents                                                  |
| ----------- | --------------------------------------------------------- |
| `.report/`  | HTML report (open `index.html` after a run)               |
| `.results/` | Screenshots, videos and traces — captured only on failure |

Retries: **1** locally, **2** on CI.

---

## Troubleshooting

**Missing env vars** — `globalSetup` throws a clear error listing which variables are absent.

**Browser not installed** — run `yarn playwright install chromium`.

**Cannot reach staging/devel** — make sure WARP Client is connected.

**A spec fails right after a deploy** — devel runs feature branches (the logged-out `/login` page shows the version).
Compare against that branch, not `main`, before treating a failure as a test bug.

**Many specs fail in `prepareUser`, or uploads hang on `Nahrávanie 1/1`** — check the machine before the app:

```bash
pgrep -c -f chrome-linux64/chrome    # a run that was interrupted leaves its browsers behind
free -h                              # < ~2Gi available and every wall-clock wait starts timing out
```

An interrupted run (Ctrl-C) orphans its Chromium processes, each keeping its own
`/tmp/playwright_chromiumdev_profile-*` and a renderer holding ~1Gi. A few of those and the admin can no longer
boot within the 15s expect timeout — the failure then looks like `showUnreleasedFeatures` not finding the DEBUG
row, `changeLicence` never settling, or the upload overlay never finishing, on spec after spec. The tell is the
failure snapshot: `main > progressbar` and nothing else, i.e. the app never finished loading. Kill the orphans
(they are the `chrome` processes whose parent is not `chrome`) and re-run.
