# Vitrine

Vitrine helps small business owners see how they are doing online, and what to fix, in one place. It brings together their website status, Google reviews, how easily they are found on Google, and how fast their site loads.

This is the Progressive Web App for assignment 1 of Mobile Applications at UCLL. It is built on the course's Expo starter, and the same code becomes the native app in assignment 2.

📄 **Paper:** [paper/PAPER.md](paper/PAPER.md): problem statement, user research, features, competitors, wireframes, roadmap and MoSCoW. The user testing kit is in [paper/user-testing/](paper/user-testing/).

> **Demo data unless Supabase keys are set.** Without keys, all businesses are fictional and every screen labels its data source. With keys, owners get real accounts and their own website is really checked. See [Accounts and real data](#accounts-and-real-data-supabase).

## What's in the app

| Screen | What it shows |
|---|---|
| Home | Overall score, what to fix first, the four areas, score over time, recent changes |
| Issues | Everything that needs attention, with filters, plain explanations and steps to fix it |
| Website | Availability, response time, last successful check, basic health, live test |
| Found on Google | Page titles, descriptions, headings, visibility, broken links |
| Speed | Load time, Core Web Vitals in plain words, what is slowing the site down |
| Reviews | Rating, trend, recent reviews, suggested replies |
| Settings | Switch business, theme, install the app, data sources, reset demo |

The three sample businesses each show a different situation:

- **Bakkerij Zonneveld:** mixed results
- **Praktijk Lindenhof:** healthy
- **Fietsatelier De Spaak:** website down, reviews not connected

Log in with "Use the demo account", or with any valid email address and any password. Nothing is sent anywhere.

## Run it locally

You need Node 20 or newer.

```bash
npm install
npm run web
```

To test on a phone on the campus network, use `npm run tunnel` or a phone hotspot, because Eduroam blocks the connection.

## Build the PWA

The service worker only runs in a production build.

```bash
npm run build:web   # builds to dist/ and adds the file list to the service worker
npm run serve:web   # serves dist/ on http://localhost:8081
```

Installing on a phone requires HTTPS, and the host must serve `/reviews` from `reviews.html`.

### Put it online (Vercel)

The app is hosted on Vercel, and every push to `main` goes live by itself. `vercel.json` holds all the settings:

- Vercel builds with `npm run build:web`, serves `dist/`, and uses clean URLs, so `/reviews` serves `reviews.html`.
- The service worker and manifest are never cached, so updates arrive.
- Unknown addresses show the app's not-found page (`404.html`, copied from `+not-found.html` during the build).
- `CYPRESS_INSTALL_BINARY=0` stops the build from downloading the Cypress test browser.

To set it up once, sign in at [vercel.com](https://vercel.com/signup) with GitHub. Then open [vercel.com/new](https://vercel.com/new), import this repository, and press **Deploy** without changing any settings. Pushes to other branches get their own preview link.

## Accounts and real data (Supabase)

The app has two modes, chosen by two public values in `.env`:

| | Without keys | With keys |
|---|---|---|
| Log in | Demo only. Any email works and nothing leaves the device. | Real accounts: register, log in, reset password. "Explore with sample data" stays available. |
| Data | Three fictional businesses | Your own businesses, checked by the server |
| Website monitoring | Sample | Every 10 minutes, also while the app is closed (`pg_cron`) |
| Search and speed | Sample | Your pages, plus Google PageSpeed (needs `PAGESPEED_API_KEY`) |
| Google reviews | Sample | Not connected (needs a Google billing account) |

```bash
# .env (never committed). Both values are public by design: row level security protects the data.
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
```

**What is where**

- `supabase/migrations/`: the tables, row level security (owners only see their own businesses), the 10-minute schedule and 90-day cleanup.
- `supabase/functions/`: the checks run on the server, so no API key is ever in the app.
  - `run-check`: a full check
  - `uptime-monitor`: called by the schedule
  - `check-url`: the live test, with a real status code
  - `delete-account`: deletes the account
- `src/lib/supabase.ts`: the client. Login tokens are stored in the Keychain or Keystore on native (`sessionStore.ts`) and in browser storage on the web (`sessionStore.web.ts`), because browsers have no secure storage.
- `src/services/liveMonitoringService.ts`: reads the results. `monitoringService.ts` picks demo or live data, so screens don't know the difference.
- `src/services/syncService.ts`: fixes and replies made offline wait in a queue and are sent when the connection returns.

**Setting up a project** (once, with the CLI)

```bash
npx supabase login
npx supabase projects create vitrine --region eu-central-1   # EU region (GDPR)
npx supabase link --project-ref <ref>
npx supabase db push                                         # tables, security, schedules
npx supabase config push                                     # login settings from supabase/config.toml
npx supabase functions deploy                                # the four functions
npx supabase secrets set CRON_SECRET=<random> PAGESPEED_API_KEY=<key>
```

Then run this SQL once (Dashboard → SQL Editor), so the schedule can call the monitor:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<the same CRON_SECRET>', 'cron_secret');
```

Supabase's built-in email service only sends to the project team's own addresses. Email confirmation is therefore turned off, so testers can sign up straight away. Password-reset emails to other people need your own email provider (Dashboard → Authentication → Emails → SMTP).

## Run the tests

Test the production build, because the service worker doesn't run on the dev server.

```bash
npm run build:web
npm run serve:web      # leave this running in a second terminal
npm run cypress:run    # 98 end-to-end, logic, layout and privacy tests
npm run test:offline   # shuts a server down and checks the app still works in real Chrome
npm run typecheck

npm run build:web:stub # a build with fake Supabase keys
npm run test:accounts  # 10 tests: register, log in, first check, offline queue, delete account
npm run build:web      # back to the normal build
```

The account tests answer every Supabase request themselves, so they need no real project. GitHub Actions runs all of these on every push (`.github/workflows/tests.yml`), and the pre-commit hook runs the typecheck.

If Cypress fails with `bad option: --smoke-test` in a VS Code terminal, the terminal has set `ELECTRON_RUN_AS_NODE`. Clear that variable, or use another terminal.

`npm run storybook` shows the base components.

## How the code is organised

```
app/                      Routes only. No styling and no data fetching.
paper/                    The paper, wireframes, screenshots and user testing kit
public/                   Manifest, service worker, offline page, icons
scripts/                  Icon generator, build steps, local server, offline test
supabase/                 Database migrations, server functions, project config
src/
  lib/                    The Supabase client
  components/primitives/  Base components. All shared styling lives here.
  components/<area>/      Screens' building blocks
  data/demo/              Raw demo results, with no scores in them
  logic/                  Pure functions: scoring, issue rules, trends
  hooks/                  Connect screens to state and services
  services/               Everything that talks to the outside world
  state/                  Zustand stores
  theme/                  Colours, spacing and dark mode
  types/                  Shared types
```

Data flows one way: **services → stores → `logic/` → hooks → components**.

Every score, average, trend and issue is calculated in `logic/` from raw results, so the numbers can't disagree between screens.

### Conventions

These come from the course guidelines:

- Keep the starter's folders. Adding new folders is fine.
- Build UI from the base components. Styling goes in components, never in route files, and there is no CSS.
- Everything is typed: no `null`, no `never`, no `as` without a comment.
- No API calls in components. They belong in `src/services/`.
- No secrets in the app bundle.

### Web and native

Browser-only code lives in `*.web.ts` services, each with a `.ts` version for native. Components contain no browser APIs, so they carry over to the native app.

### How scores work

| Status | Score |
|---|---|
| Healthy | 80 or higher |
| Needs work | 50 to 79 |
| Critical | Below 50 |

The overall score weights Website at 30%, Speed at 25%, Reviews at 25% and Found on Google at 20%. An area that can't be measured is left out rather than counted as zero. A website that is down caps the overall score at 35.

Marking an issue as fixed doesn't change the score. The score only changes after a new check confirms the fix.

## Known limitations

- In demo mode, monitoring, reviews and search data are samples, and "Run new check" is simulated.
- With accounts, Google reviews are not connected, because the Places API needs a billing account.
- The certificate's expiry date isn't known for real checks. Server functions see that it is valid, but not when it ends.
- In demo mode, the live website test runs from the browser and can't read status codes. With an account it runs on the server and can.
- Dates and numbers use British English formats, and the text is English only.
