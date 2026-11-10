// Chapter 23: a readable privacy policy, reachable before signing up and from Settings,
// plus "Download my data" and a working delete. These run in demo mode, without accounts.

describe('Privacy policy', () => {
  it('can be read without logging in', () => {
    cy.visitApp('/privacy', { loggedIn: false });
    cy.byTestId('screen-privacy').should('be.visible');
    cy.contains('h1', 'Privacy policy').should('be.visible');
    cy.contains('EU region').should('be.visible');
    cy.contains('Your rights').scrollIntoView().should('be.visible');
    cy.location('pathname').should('eq', '/privacy');
  });

  it('is linked from Settings', () => {
    cy.visitApp('/settings');
    cy.byTestId('privacy-link').click();
    cy.location('pathname').should('eq', '/privacy');
    cy.byTestId('privacy-back').click();
    cy.location('pathname').should('eq', '/settings');
  });

  it('is saved for offline use', () => {
    cy.request('/sw.js').its('body').should('contain', '"/privacy"');
  });
});

describe('Your data', () => {
  it('downloads everything the demo saved, as JSON', () => {
    const today = new Date().toISOString().slice(0, 10);
    cy.visitApp('/settings');
    cy.byTestId('download-data').click();
    cy.readFile(`cypress/downloads/vitrine-my-data-${today}.json`, { timeout: 10000 }).then((data) => {
      expect(data.explanation).to.contain('only on this device');
      expect(data.onThisDevice['vitrine-session'].state.user.email).to.equal('test@example.com');
      expect(data).not.to.have.nested.property('onThisDevice.vitrine-session.state.user.password');
    });
  });

  it('deletes the demo data and logs out, after confirming', () => {
    cy.visitApp('/settings');
    cy.byTestId('delete-account').click();
    cy.byTestId('delete-account-confirm').should('contain', 'deletes everything the demo saved');
    cy.byTestId('delete-account-yes').click();
    cy.location('pathname').should('eq', '/login');
    cy.window().then((win) => {
      const session = JSON.parse(win.localStorage.getItem('vitrine-session') ?? '{}');
      expect(session.state.isAuthenticated).to.equal(false);
    });
    cy.visit('/settings');
    cy.location('pathname').should('eq', '/login');
  });

  it('shows no account options when this version has no accounts', () => {
    cy.visitApp('/login', { loggedIn: false });
    cy.byTestId('register-link').should('not.exist');
    cy.byTestId('forgot-password-link').should('not.exist');
    cy.visit('/register');
    cy.contains('This version runs on demo data').should('be.visible');
  });
});
