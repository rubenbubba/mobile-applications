function score(): Cypress.Chainable<number> {
  return cy.byTestId('overall-score').invoke('text').then((text) => Number(text));
}

describe('Fixing an issue', () => {
  it('only raises the score after a new check confirms the fix', () => {
    cy.visitApp('/');
    cy.byTestId('overall-score').should('be.visible');

    score().then((before) => {
      cy.visitApp('/details/certificate-expiring');
      cy.byTestId('mark-fixed').click();
      cy.byTestId('issue-waiting').should('be.visible');

      cy.get('[data-testid="nav-home"]').click();
      score().should('eq', before);

      cy.get('[data-testid="nav-issues"]').click();
      cy.byTestId('waiting-for-check').should('be.visible');
      cy.byTestId('waiting-for-check').within(() => {
        cy.byTestId('run-check').click();
      });
      cy.byTestId('toast', { timeout: 8000 }).should('contain.text', 'fix confirmed');
      cy.byTestId('waiting-for-check').should('not.exist');

      cy.byTestId('issues-tab-resolved').should('contain.text', '1').click();
      cy.byTestId('issue-certificate-expiring').should('be.visible');

      cy.get('[data-testid="nav-home"]').click();
      score().should('be.greaterThan', before);
      cy.contains('Fix confirmed: Your security certificate').scrollIntoView().should('be.visible');
    });
  });

  it('keeps fixes after a reload', () => {
    cy.visitApp('/details/broken-links');
    cy.byTestId('mark-fixed').click();
    cy.byTestId('issue-waiting').should('be.visible');

    cy.reload();
    cy.byTestId('issue-waiting').should('be.visible');
  });

  it('can be undone from the toast', () => {
    cy.visitApp('/details/broken-links');
    cy.byTestId('mark-fixed').click();
    cy.byTestId('toast-action').click();
    cy.byTestId('mark-fixed').should('be.visible');
    cy.byTestId('issue-state-open').should('be.visible');
  });

  it('can be undone from the issue page', () => {
    cy.visitApp('/details/broken-links');
    cy.byTestId('mark-fixed').click();
    cy.byTestId('undo-mark-fixed').click();
    cy.byTestId('mark-fixed').should('be.visible');
  });

  it('explains when an issue cannot be marked as fixed', () => {
    cy.visitApp('/details/rating-dropping');
    cy.byTestId('issue-not-markable').should('be.visible');
    cy.byTestId('mark-fixed').should('not.exist');
  });

  it('handles an issue that does not apply to this business', () => {
    cy.visitApp('/details/site-down');
    cy.byTestId('issue-not-found').should('be.visible');
  });
});

describe('Issue filters', () => {
  beforeEach(() => {
    cy.visitApp('/issues');
    cy.byTestId('issue-list').should('be.visible');
  });

  it('filters by severity', () => {
    cy.byTestId('filter-severity-high').click();
    cy.byTestId('issue-certificate-expiring').should('be.visible');
    cy.byTestId('issue-broken-links').should('not.exist');
  });

  it('filters by area', () => {
    cy.byTestId('filter-area-reviews').click();
    cy.byTestId('issue-unanswered-negative-reviews').should('be.visible');
    cy.byTestId('issue-certificate-expiring').should('not.exist');
  });

  it('shows an empty state when nothing matches', () => {
    cy.byTestId('filter-severity-critical').click();
    cy.byTestId('issues-empty').should('be.visible');
  });

  it('shows empty states for the other tabs', () => {
    cy.byTestId('issues-tab-marked-fixed').click();
    cy.byTestId('issues-empty').should('contain.text', 'Nothing waiting');
    cy.byTestId('issues-tab-resolved').click();
    cy.byTestId('issues-empty').should('contain.text', 'Nothing resolved yet');
  });
});
