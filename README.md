# Vitrine

Vitrine helps small business owners see how they are doing online, and what to fix, in one place. It brings together their website status, Google reviews, how easily they are found on Google, and how fast their site loads.

This is the Progressive Web App for assignment 1 of Mobile Applications at UCLL. It is built on the course's Expo starter, and the same code becomes the native app in assignment 2.

📄 **Paper:** [paper/PAPER.md](paper/PAPER.md): problem statement, user research, features, competitors, wireframes, roadmap and MoSCoW. The user testing kit is in [paper/user-testing/](paper/user-testing/).

> **This version runs on demo data.** All businesses are fictional, and every screen labels its data source. The one exception is "Test a website now" on the Website screen, which is a real test from your device. See [TODOS.md](TODOS.md) for what is needed to connect real data.

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

## Run the tests

Test the production build, because the service worker doesn't run on the dev server.

```bash
npm run build:web
npm run serve:web      # leave this running in a second terminal
npm run cypress:run    # 92 end-to-end, logic and layout tests
npm run test:offline   # shuts a server down and checks the app still works in real Chrome
npm run typecheck
```

If Cypress fails with `bad option: --smoke-test` in a VS Code terminal, the terminal has set `ELECTRON_RUN_AS_NODE`. Clear that variable, or use another terminal.

`npm run storybook` shows the base components.

## How the code is organised

```
app/                      Routes only. No styling and no data fetching.
public/                   Manifest, service worker, offline page, icons
scripts/                  Icon generator, build step, local server, offline test
src/
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

- Monitoring, reviews and search data are demo data, and "Run new check" is simulated.
- Saved data lives in browser storage on one device. Clearing site data removes it.
- The live website test can't read status codes, so a site showing an error page still counts as responding.
- Dates and numbers use British English formats, and the text is English only.
