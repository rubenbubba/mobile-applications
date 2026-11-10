// Takes phone-size screenshots of every screen for the paper (paper/screens/).
// Not part of the test suite. Run it with: npm run capture:screens (with serve:web running).
// Cypress saves them in paper/screens/screens.cy.ts/. Move the files up one folder afterwards.

const SHOTS: { name: string; path: string; ready: string; businessId?: string; loggedIn?: boolean }[] = [
  { name: '01-login', path: '/login', ready: 'login-button', loggedIn: false },
  { name: '02-home', path: '/', ready: 'health-hero' },
  { name: '03-issues', path: '/issues', ready: 'issue-list' },
  { name: '04-issue-detail', path: '/details/missing-meta-descriptions', ready: 'issue-detail' },
  { name: '05-website', path: '/website', ready: 'website-status' },
  { name: '06-found-on-google', path: '/seo', ready: 'seo-summary' },
  { name: '07-speed', path: '/performance', ready: 'speed-summary' },
  { name: '08-reviews', path: '/reviews', ready: 'rating-summary' },
  { name: '09-settings', path: '/settings', ready: 'settings-sources' },
  { name: '10-error-site-down', path: '/', ready: 'health-hero', businessId: 'fietsatelier-de-spaak' },
  { name: '11-empty-reviews-not-connected', path: '/reviews', ready: 'screen-reviews', businessId: 'fietsatelier-de-spaak' },
  { name: '12-healthy-business', path: '/', ready: 'health-hero', businessId: 'praktijk-lindenhof' },
];

describe('Screens for the paper', () => {
  for (const shot of SHOTS) {
    it(shot.name, () => {
      cy.viewport(390, 844);
      cy.visitApp(shot.path, { businessId: shot.businessId, loggedIn: shot.loggedIn ?? true, themeMode: 'light' });
      cy.byTestId(shot.ready).should('be.visible');
      cy.wait(600);
      cy.screenshot(shot.name, { capture: 'viewport', overwrite: true });
    });
  }

  it('00-loading', () => {
    cy.viewport(390, 844);
    cy.visitApp('/', { themeMode: 'light' });
    cy.screenshot('00-loading', { capture: 'viewport', overwrite: true });
  });
});
