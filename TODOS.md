# To do

Ticked items are done. Items marked **You** need you: an account, a phone, or real people.

## Tonight (PWA due 10 Nov, 23:59: deck 5 says "submit github link")

- [ ] **You:** put the app online. Sign in at https://vercel.com/signup with "Continue with GitHub", open https://vercel.com/new, import `rubenbubba/mobile-applications`, press **Deploy** without changing anything. Copy the `…vercel.app` link.
- [ ] **You:** submit https://github.com/rubenbubba/mobile-applications (and the Vercel link) where Mr Jacobs asked for it.
- [x] Hosting config (`vercel.json`), clean URLs, 404 page, Node 22.
- [x] Paper draft in [paper/PAPER.md](paper/PAPER.md), in the chapter 24.9 order: problem, solution, features, competitors, wireframes, roadmap, MoSCoW.
- [x] Low-fidelity wireframes with numbered screens and arrows, plus screenshots of every screen.

## Check with Mr Jacobs

- [ ] **You:** the deadline. Deck 1 says 04.11.26, deck 5 says 10/11 at 23:59.
- [ ] **You:** is demo data enough for the PWA? (The Supabase version is ready on a branch either way.)

## Paper and user tests (chapter 25)

- [ ] **You:** test with 3 people from the target group, using the kit in [paper/user-testing/](paper/user-testing/). About 30 minutes each.
- [ ] **You:** fill in the ✏️ parts of the paper from those sessions: where the problem comes from, target group, personas, store ratings of competitors, dates in the roadmap. Don't invent them.
- [ ] Process the feedback: fix the top 3 problems (send me the results and I'll do the code).

## Supabase: real accounts and data (code done on branch `feature/supabase`)

- [x] Supabase client, login, registration, password reset, sessions in secure storage (native) or browser storage (web).
- [x] Tables, row level security, cascade delete: `supabase/migrations/`.
- [x] Live monitoring: `run-check`, `uptime-monitor` (every 10 minutes via `pg_cron`), `check-url` (real status codes), `delete-account`.
- [x] Offline queue for fixes and replies (chapter 22).
- [x] Privacy policy, "Download my data", "Delete my account" (chapter 23).
- [x] Tests: 6 privacy tests, 10 account tests against a fake Supabase server, all in GitHub Actions.
- [ ] **You:** sign up at https://supabase.com/dashboard/sign-up (GitHub works), then in a VS Code terminal run `npx supabase login` and tell me. I create the EU project and set everything up.
- [ ] **You (optional):** a free PageSpeed key for real speed results: https://developers.google.com/speed/docs/insights/v5/get-started, "Get a Key". Put it in `.env` as `PAGESPEED_API_KEY=…` and tell me.
- [ ] Merge `feature/supabase` into `main` once the PWA is graded (tell me, I do it).
- [ ] Google reviews: needs the Places API, which needs a Google Cloud billing account. Skipped for now.
- [ ] Password-reset emails to people outside the Supabase team need your own email provider (SMTP), for example Resend's free plan.

## Assignment 2: native app (31.12.26)

- [x] AsyncStorage in `storageService.ts` and NetInfo in `connectivityService.ts`.
- [x] Android package and iOS bundle identifier in `app.json`.
- [ ] **You:** sign up at https://expo.dev/signup, then run `npx eas-cli login` in a VS Code terminal and tell me. I set up EAS and the development builds.
- [ ] **You:** for a real iPhone build you need the Apple Developer Program (about €99/year): https://developer.apple.com/programs/enroll/. Android needs nothing extra.
- [ ] Push notification when the site goes down (the native feature a PWA can't offer reliably).
- [ ] Test on physical devices.

## Nice to have

- [x] Tests before each commit: Husky runs the typecheck, and GitHub Actions runs every test after each push.
- [ ] Translations (chapter 20). All text is English and written directly in the code.
- [ ] **You:** rename "Vitrine" if you pitched a different name (`APP_NAME`, `app.json`, `public/manifest.json`, `app/+html.tsx`).
