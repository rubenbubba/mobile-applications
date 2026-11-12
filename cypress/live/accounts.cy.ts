// Real accounts, against a build made with fake Supabase keys (scripts/build-web-stub.js).
// Cypress plays the Supabase server: every request to https://stub.supabase.co is answered here,
// so these tests check the app's side of registration, login, adding a business, live checks and the offline queue.
// Run with: npm run test:accounts

const SUPABASE = 'https://stub.supabase.co';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const BUSINESS_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'owner@example.com';

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const user = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: EMAIL,
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-11-10T10:00:00Z',
};

function session() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({ sub: USER_ID, email: EMAIL, role: 'authenticated', aud: 'authenticated', exp: expiresAt })}.signature`;
  return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, refresh_token: 'refresh-token', user };
}

const business = {
  id: BUSINESS_ID,
  name: 'Bakery Sunfield',
  category: 'Bakery',
  city: 'Leuven',
  website_url: 'https://www.bakery-sunfield.example',
};

function checkRow(checkedAt: string) {
  return {
    checked_at: checkedAt,
    website: {
      url: business.website_url,
      isUp: true,
      statusCode: 200,
      lastSuccessfulCheck: checkedAt,
      responseTimeMs: 320,
      uptimeDays: [],
      httpsEnabled: true,
      redirectsToHttps: true,
      mobileFriendly: true,
    },
    seo: {
      pages: [
        { path: '/', name: 'Home', title: 'Bakery Sunfield', metaDescription: 'Fresh bread in Leuven.', h1Count: 1, headingsInOrder: true, indexable: true },
        { path: '/contact', name: 'Contact', title: 'Contact', h1Count: 1, headingsInOrder: true, indexable: true },
      ],
      brokenLinks: [],
      hasSitemap: true,
      hasStructuredData: false,
    },
    performance: {
      loadTimeSeconds: 2.1,
      lcpSeconds: 2.0,
      cls: 0.02,
      weightParts: [
        { id: 'images', label: 'Images', sizeMb: 0.6 },
        { id: 'scripts', label: 'Scripts', sizeMb: 0.3 },
      ],
    },
  };
}

interface Backend {
  businesses: (typeof business)[];
  checks: ReturnType<typeof checkRow>[];
}

// Answers like Supabase would. Returns the shared state so a test can change it.
function stubSupabase(initial: Partial<Backend> = {}): Backend {
  const backend: Backend = { businesses: [], checks: [], ...initial };

  cy.intercept('POST', `${SUPABASE}/auth/v1/token?grant_type=password`, (req) => {
    if (req.body.password === 'correct-horse') req.reply(session());
    else req.reply(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
  }).as('login');
  cy.intercept('POST', `${SUPABASE}/auth/v1/signup*`, session()).as('signup');
  cy.intercept('POST', `${SUPABASE}/auth/v1/recover*`, { statusCode: 200, body: {} }).as('recover');
  cy.intercept('GET', `${SUPABASE}/auth/v1/user`, user).as('getUser');
  cy.intercept('POST', `${SUPABASE}/auth/v1/logout*`, { statusCode: 204, body: '' }).as('logout');

  cy.intercept('GET', `${SUPABASE}/rest/v1/businesses*`, (req) => req.reply(backend.businesses)).as('listBusinesses');
  cy.intercept('POST', `${SUPABASE}/rest/v1/businesses*`, (req) => {
    backend.businesses.push(business);
    req.reply(201, business);
  }).as('addBusiness');
  cy.intercept('GET', `${SUPABASE}/rest/v1/check_snapshots*`, (req) => req.reply(backend.checks)).as('checks');
  cy.intercept('GET', `${SUPABASE}/rest/v1/uptime_days*`, []).as('uptimeDays');
  cy.intercept('GET', `${SUPABASE}/rest/v1/uptime_checks*`, []).as('uptime');
  cy.intercept('GET', `${SUPABASE}/rest/v1/issue_progress*`, []).as('progress');
  cy.intercept('GET', `${SUPABASE}/rest/v1/review_replies*`, []).as('replies');
  cy.intercept('POST', `${SUPABASE}/rest/v1/issue_progress*`, { statusCode: 201, body: '' }).as('saveProgress');
  cy.intercept('POST', `${SUPABASE}/functions/v1/run-check`, (req) => {
    backend.checks.unshift(checkRow(new Date().toISOString()));
    req.reply({ ok: true });
  }).as('runCheck');
  cy.intercept('POST', `${SUPABASE}/functions/v1/delete-account`, { ok: true }).as('deleteAccount');

  return backend;
}

function setOnline(win: Cypress.AUTWindow, online: boolean) {
  Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => online });
  win.dispatchEvent(new win.Event(online ? 'online' : 'offline'));
}

function logIn() {
  cy.visitApp('/login', { loggedIn: false });
  cy.byTestId('email-input').type(EMAIL);
  cy.byTestId('password-input').type('correct-horse');
  cy.byTestId('login-button').click();
  cy.wait('@login');
}

describe('Log in screen with accounts', () => {
  beforeEach(() => {
    stubSupabase();
  });

  it('offers registration, a password reset and the sample data', () => {
    cy.visitApp('/login', { loggedIn: false });
    cy.byTestId('demo-mode-note').should('not.exist');
    cy.byTestId('register-link').should('be.visible');
    cy.byTestId('forgot-password-link').should('be.visible');
    cy.byTestId('demo-login-button').should('contain', 'Explore with sample data');
  });

  it('explains a wrong password in plain words', () => {
    cy.visitApp('/login', { loggedIn: false });
    cy.byTestId('email-input').type(EMAIL);
    cy.byTestId('password-input').type('wrong-password');
    cy.byTestId('login-button').click();
    cy.get('[role="alert"]').should('contain', "That email address and password don't match.");
    cy.location('pathname').should('eq', '/login');
  });

  it('still opens the sample businesses without an account', () => {
    cy.visitApp('/login', { loggedIn: false });
    cy.byTestId('demo-login-button').click();
    cy.byTestId('health-hero').should('be.visible');
    cy.get('[data-testid="source-demo"]:visible').should('exist');
  });

  it('sends a password reset link', () => {
    cy.visitApp('/forgot-password', { loggedIn: false });
    cy.byTestId('forgot-email').type(EMAIL);
    cy.byTestId('forgot-button').click();
    cy.wait('@recover').its('request.body.email').should('eq', EMAIL);
    cy.byTestId('reset-link-sent').should('contain', EMAIL);
  });

  it('asks for a new link when a reset link has expired', () => {
    cy.visitApp('/reset-password', { loggedIn: false });
    cy.byTestId('reset-link-expired').should('be.visible');
  });
});

describe('A new account', () => {
  it('registers, adds a business and gets its first real check', () => {
    stubSupabase();
    cy.visitApp('/register', { loggedIn: false });
    cy.byTestId('register-privacy').should('be.visible');
    cy.byTestId('register-email').type(EMAIL);
    cy.byTestId('register-password').type('short');
    cy.byTestId('register-button').click();
    cy.get('[role="alert"]').should('contain', 'at least 8 characters');

    cy.byTestId('register-password').clear().type('correct-horse');
    cy.byTestId('register-button').click();
    cy.wait('@signup');

    // Empty state: nothing to show until there is a business.
    cy.byTestId('screen-first-business').should('be.visible');
    cy.byTestId('business-name').type('Bakery Sunfield');
    cy.byTestId('business-category').type('Bakery');
    cy.byTestId('business-city').type('Leuven');
    cy.byTestId('business-website').type('http://www.bakery-sunfield.example');
    cy.byTestId('add-business-button').click();
    cy.contains('Use the secure https:// address').should('be.visible');

    cy.byTestId('business-website').clear().type('www.bakery-sunfield.example');
    cy.byTestId('add-business-button').click();
    cy.wait('@addBusiness').its('request.body').should('deep.include', {
      name: 'Bakery Sunfield',
      website_url: 'https://www.bakery-sunfield.example',
    });

    // The first check starts by itself, and its real results replace "Not checked yet".
    cy.wait('@runCheck').its('request.body').should('deep.equal', { businessId: BUSINESS_ID });
    cy.byTestId('health-hero').should('be.visible');
    cy.contains('h1', 'Bakery Sunfield').should('be.visible');
    cy.get('[data-testid="source-live"]:visible').should('exist');
    cy.byTestId('demo-data-note').should('not.exist');
    cy.byTestId('overall-score').invoke('text').should('match', /\d+/);
  });
});

describe('A signed-in owner', () => {
  it('sees real data sources and no demo controls in Settings', () => {
    stubSupabase({ businesses: [business], checks: [checkRow(new Date().toISOString())] });
    logIn();
    cy.byTestId('health-hero').should('be.visible');
    cy.visit('/settings');
    cy.byTestId('settings-business').should('contain', 'Your businesses').and('contain', 'Bakery Sunfield');
    cy.byTestId('settings-sources').within(() => {
      cy.get('[data-testid="source-live"]').should('have.length', 3);
      cy.get('[data-testid="source-demo"]').should('not.exist');
    });
    cy.byTestId('reset-demo').should('not.exist');
  });

  it('keeps a fix made offline and sends it when the connection returns', () => {
    stubSupabase({ businesses: [business], checks: [checkRow(new Date().toISOString())] });
    logIn();
    cy.byTestId('health-hero').should('be.visible');
    cy.visit('/details/missing-meta-descriptions');
    cy.byTestId('issue-detail').should('be.visible');

    cy.window().then((win) => setOnline(win, false));
    cy.byTestId('offline-banner').should('be.visible');
    cy.byTestId('mark-fixed').click();
    cy.byTestId('issue-waiting').should('be.visible');
    cy.window().then((win) => {
      const queue = JSON.parse(win.localStorage.getItem('vitrine-sync-queue') ?? '[]');
      expect(queue).to.have.length(1);
      expect(queue[0]).to.include({ kind: 'issue', issueId: 'missing-meta-descriptions', status: 'marked' });
    });

    cy.window().then((win) => setOnline(win, true));
    cy.wait('@saveProgress').its('request.body').should('deep.include', {
      business_id: BUSINESS_ID,
      issue_id: 'missing-meta-descriptions',
      status: 'marked',
    });
    cy.window().its('localStorage').invoke('getItem', 'vitrine-sync-queue').should('eq', null);
  });

  it('logs out and leaves nothing of the account on the device', () => {
    stubSupabase({ businesses: [business], checks: [checkRow(new Date().toISOString())] });
    logIn();
    cy.byTestId('health-hero').should('be.visible');
    cy.visit('/settings');
    cy.byTestId('logout').click();
    cy.location('pathname').should('eq', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('vitrine-monitoring') ?? '').not.to.contain(BUSINESS_ID);
    });
  });

  it('deletes the account after confirming', () => {
    stubSupabase({ businesses: [business], checks: [checkRow(new Date().toISOString())] });
    logIn();
    cy.byTestId('health-hero').should('be.visible');
    cy.visit('/settings');
    cy.byTestId('delete-account').click();
    cy.byTestId('delete-account-confirm').should('contain', 'cannot be undone');
    cy.byTestId('delete-account-yes').click();
    cy.wait('@deleteAccount');
    cy.location('pathname').should('eq', '/login');
  });
});
