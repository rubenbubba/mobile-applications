# To do

## Check first

- [ ] **Confirm the PWA deadline with Mr Jacobs.** Deck 1 says 04.11.26, deck 5 says 10/11 at 23:59, and my notes say the week after Easter.
- [ ] **Ask whether demo data is enough for the PWA.** Deck 2 lists "build and adapt the API" after building and testing the PWA, but chapter 25 puts Supabase under the PWA step.

## Connect Supabase

The course chooses Supabase as the backend. The app's services are ready for it, so screens shouldn't need to change.

### Set up

- [ ] Create a Supabase project in an **EU region** (GDPR, chapter 23).
- [ ] Add `@supabase/supabase-js`.
- [ ] Put the project URL and anon key in `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `.env` is already in `.gitignore`.

### Login

- [ ] Replace the demo login and logout in `src/services/authService.ts` with Supabase Auth.
- [ ] Remove `DEMO_EMAIL` and `DEMO_PASSWORD`, plus the demo button and note in `src/components/auth/LoginPanel.tsx`.
- [ ] Decide where tokens go. The course says to use secure storage, which browsers don't have, so ask what is expected for the PWA. Use `expo-secure-store` in the native app.
- [ ] Add registration and password reset.
- [ ] Update the `testID`s and test login in `cypress/e2e/login.cy.ts` with a real test account.

### Data

- [ ] Create the tables: `businesses`, `check_snapshots`, `issue_progress`, `review_replies`.
- [ ] Turn on row level security, so owners only see their own business.
- [ ] Replace `fetchSnapshot`, `runCheck` and `listBusinesses` in `src/services/monitoringService.ts`. Keep the same signatures.
- [ ] Return `source: 'live'` for real data. The labels on screen then update by themselves.
- [ ] Save fixes and replies made offline in a queue, and send them when the connection returns (chapter 22).
- [ ] Remove `src/data/demo/` and "Reset demo data" in Settings.

### Privacy, needed once real accounts exist

- [ ] Add a privacy policy, linked from registration and Settings.
- [ ] Add "Delete my account" and "Download my data".

## Connect real monitoring data

These need API keys, and the course doesn't allow keys in the app. Run each one through a **Supabase Edge Function**.

- [ ] **Speed and search:** Google PageSpeed Insights API with a free Google API key. Without a key it returned a 429 quota error when I tested it on 3 Nov 2026.
- [ ] **Google reviews:** Google Business Profile API or Places API. Check access and billing first.
- [ ] **Website availability:** a scheduled function that checks each site around the clock, because the app can't do this while it is closed.
- [ ] Give the live test on the Website screen real status codes by moving it to a function too.

## Before submitting the PWA

- [ ] Deploy `dist/` to an HTTPS host. See "Build the PWA" in the README.
- [ ] Install it on a real Android phone and a real iPhone. Turn on airplane mode and check it still opens.
- [ ] Test with at least three people from the target group, and process their feedback (chapter 25).
- [ ] Write the paper, using the checklist in chapter 24.9. It needs real input, so don't make up the interviews or personas:
  - [ ] Problem statement
  - [ ] Solution, and why it should be a mobile app
  - [ ] User research: target group, stakeholders, personas
  - [ ] Features
  - [ ] Competitors
  - [ ] Wireframes
  - [ ] Roadmap
  - [ ] MoSCoW scope

## Assignment 2: native app (31.12.26)

- [ ] Add `@react-native-async-storage/async-storage` and use it in `storageService.ts`. It currently only keeps data in memory on native.
- [ ] Add `@react-native-community/netinfo` and use it in `connectivityService.ts`. It currently always reports online on native.
- [ ] Set up EAS and create development builds for Android and iOS.
- [ ] Add a native feature that a PWA can't offer, such as push notifications when the site goes down.
- [ ] Test on physical devices.

## Nice to have

- [ ] Translations (chapter 20). All text is English and written directly in the code, so start before the app grows further.
- [ ] Run the tests before each commit with a pre-commit hook (decks 4.2 and chapter 12).
- [ ] Tweak the product name "Vitrine" if you pitched a different one. Change `APP_NAME`, `app.json`, `public/manifest.json` and `app/+html.tsx`.
