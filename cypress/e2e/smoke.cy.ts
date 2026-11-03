const PAGES: { path: string; screen: string; content: string }[] = [
  { path: '/', screen: 'screen-home', content: 'health-hero' },
  { path: '/issues', screen: 'screen-issues', content: 'issue-list' },
  { path: '/website', screen: 'screen-website', content: 'website-status' },
  { path: '/seo', screen: 'screen-seo', content: 'seo-summary' },
  { path: '/performance', screen: 'screen-performance', content: 'speed-summary' },
  { path: '/reviews', screen: 'screen-reviews', content: 'rating-summary' },
  { path: '/settings', screen: 'screen-settings', content: 'settings-sources' },
  { path: '/details/certificate-expiring', screen: 'screen-issue-detail', content: 'issue-detail' },
];

describe('Every page loads', () => {
  for (const page of PAGES) {
    it(`shows its data on ${page.path}`, () => {
      cy.visitApp(page.path);
      cy.byTestId(page.screen).should('be.visible');
      cy.byTestId(page.content).scrollIntoView().should('be.visible');
    });
  }

  it('shows a friendly page for an unknown address', () => {
    cy.visit('/this-page-does-not-exist', { failOnStatusCode: false });
    cy.byTestId('screen-not-found').should('be.visible');
    cy.contains("We can't find this page").should('be.visible');
  });
});

describe('Data is labelled honestly', () => {
  for (const page of ['/', '/website', '/seo', '/performance', '/reviews']) {
    it(`marks demo data on ${page}`, () => {
      cy.visitApp(page);
      cy.get('[data-testid="source-demo"]:visible').should('exist');
    });
  }

  it('lists which sources are demo and which are live', () => {
    cy.visitApp('/settings');
    cy.byTestId('settings-sources').within(() => {
      cy.get('[data-testid="source-demo"]').should('have.length', 3);
      cy.get('[data-testid="source-live"]').should('have.length', 1);
    });
  });
});

describe('Navigation', () => {
  it('moves between the main sections on a phone', () => {
    cy.viewport(390, 844);
    cy.visitApp('/');

    cy.byTestId('nav-issues').click();
    cy.location('pathname').should('eq', '/issues');
    cy.byTestId('issue-list').should('be.visible');

    cy.byTestId('nav-website').click();
    cy.location('pathname').should('eq', '/website');

    cy.get('[data-testid="subnav-seo"]:visible').click();
    cy.location('pathname').should('eq', '/seo');
    cy.byTestId('seo-summary').should('be.visible');

    cy.get('[data-testid="subnav-performance"]:visible').click();
    cy.location('pathname').should('eq', '/performance');
    cy.byTestId('speed-summary').should('be.visible');

    cy.byTestId('nav-reviews').click();
    cy.location('pathname').should('eq', '/reviews');

    cy.byTestId('nav-settings').click();
    cy.location('pathname').should('eq', '/settings');

    cy.byTestId('nav-home').click();
    cy.location('pathname').should('eq', '/');
  });

  it('hides inactive tabs from keyboard and screen reader users', () => {
    cy.viewport(390, 844);
    cy.visitApp('/website');
    cy.byTestId('website-status').should('be.visible');
    cy.byTestId('nav-issues').click();
    cy.byTestId('issue-list').should('be.visible');

    cy.get('[data-testid^="screen-"]').should('have.length.at.least', 2);
    cy.get('[data-testid^="screen-"]:visible').should('have.length', 1);
    cy.byTestId('screen-website').should('not.be.visible');
  });

  it('uses a sidebar with every section on a large screen', () => {
    cy.viewport(1440, 900);
    cy.visitApp('/');

    cy.byTestId('nav-found-on-google').click();
    cy.location('pathname').should('eq', '/seo');
    cy.byTestId('nav-speed').click();
    cy.location('pathname').should('eq', '/performance');
    cy.get('[data-testid="subnav-seo"]').should('not.exist');
  });

  it('opens an area from its tile on the dashboard', () => {
    cy.visitApp('/');
    cy.byTestId('tile-reviews').click();
    cy.location('pathname').should('eq', '/reviews');
  });

  it('explains how the score is calculated', () => {
    cy.visitApp('/');
    cy.byTestId('score-explainer').click();
    cy.contains('combines four areas').should('be.visible');
  });
});
