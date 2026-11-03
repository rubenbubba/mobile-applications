describe('Login screen', () => {
  beforeEach(() => {
    cy.visitApp('/login', { loggedIn: false });
  });

  it('renders the login form and says it is a demo', () => {
    cy.byTestId('email-input').should('be.visible');
    cy.byTestId('password-input').should('be.visible');
    cy.byTestId('login-button').should('be.visible');
    cy.byTestId('demo-mode-note').should('contain.text', 'Demo mode');
  });

  it('shows an error for an invalid email address', () => {
    cy.byTestId('email-input').type('not-an-email');
    cy.byTestId('password-input').type('password123');
    cy.byTestId('login-button').click();

    cy.get('[role="alert"]').should('contain.text', 'valid email');
    cy.location('pathname').should('eq', '/login');
  });

  it('logs in with valid details and navigates to home', () => {
    cy.byTestId('email-input').type('test@example.com');
    cy.byTestId('password-input').type('password123');
    cy.byTestId('login-button').click();

    cy.location('pathname').should('eq', '/');
    cy.byTestId('health-hero').should('be.visible');
  });

  it('logs in with the demo account', () => {
    cy.byTestId('demo-login-button').click();
    cy.byTestId('health-hero').should('be.visible');
  });
});

describe('Session', () => {
  it('sends visitors without a session to the login screen', () => {
    cy.visitApp('/issues', { loggedIn: false });
    cy.location('pathname').should('eq', '/login');
    cy.byTestId('login-button').should('be.visible');
  });

  it('sends a logged-in visitor away from the login screen', () => {
    cy.visitApp('/login');
    cy.location('pathname').should('eq', '/');
  });

  it('stays logged in after a reload', () => {
    cy.visitApp('/', { loggedIn: false });
    cy.byTestId('demo-login-button').click();
    cy.byTestId('health-hero').should('be.visible');
    cy.reload();
    cy.byTestId('health-hero').should('be.visible');
  });

  it('logs out from settings', () => {
    cy.visitApp('/settings');
    cy.byTestId('logout').click();
    cy.location('pathname').should('eq', '/login');
    cy.visitApp('/settings', { loggedIn: false });
    cy.location('pathname').should('eq', '/login');
  });

  it('never saves a token or password', () => {
    cy.visitApp('/login', { loggedIn: false });
    cy.byTestId('email-input').type('test@example.com');
    cy.byTestId('password-input').type('super-secret-password');
    cy.byTestId('login-button').click();
    cy.byTestId('health-hero').should('be.visible');

    cy.window().then((win) => {
      const saved = win.localStorage.getItem('vitrine-session') ?? '';
      expect(saved).to.contain('test@example.com');
      expect(saved).to.not.contain('super-secret-password');
      expect(saved).to.not.contain('token');
    });
  });
});
