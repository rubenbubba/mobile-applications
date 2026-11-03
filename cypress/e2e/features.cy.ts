describe('Reviews', () => {
  beforeEach(() => {
    cy.visitApp('/reviews');
    cy.byTestId('rating-summary').should('be.visible');
  });

  it('shows the rating, the total and the trend', () => {
    cy.byTestId('average-rating').invoke('text').should('match', /^\d\.\d$/);
    cy.byTestId('review-total').should('contain.text', 'reviews on Google');
    cy.byTestId('rating-trend').should('be.visible');
  });

  it('filters reviews that need a reply', () => {
    cy.byTestId('reviews-filter-needs-reply').click();
    cy.byTestId('review-bz-2').should('be.visible');
    cy.byTestId('review-bz-1').should('not.exist');
  });

  it('suggests a reply and marks the review as replied', () => {
    cy.byTestId('reviews-filter-needs-reply').click();
    cy.byTestId('review-bz-2').should('contain.text', 'Hi Thomas');
    cy.byTestId('mark-replied-bz-2').click();
    cy.byTestId('review-bz-2').should('not.exist');
    cy.byTestId('reviews-filter-needs-reply').should('contain.text', '(1)');

    cy.byTestId('mark-replied-bz-4').click();
    cy.byTestId('reviews-empty').should('be.visible');

    cy.reload();
    cy.byTestId('reviews-filter-needs-reply').should('contain.text', '(0)');
  });
});

describe('Testing a real website', () => {
  beforeEach(() => {
    cy.visitApp('/website');
    cy.byTestId('live-check-card').scrollIntoView().should('be.visible');
  });

  it('is labelled as live and explains what it cannot see', () => {
    cy.byTestId('live-check-card').within(() => {
      cy.byTestId('source-live').should('be.visible');
      cy.contains('cannot see the page itself').should('be.visible');
    });
  });

  it('rejects an invalid address', () => {
    cy.byTestId('live-check-input').type('not a website');
    cy.byTestId('live-check-button').click();
    cy.get('[role="alert"]').should('contain.text', 'does not look like a website');
  });

  it('rejects an insecure address', () => {
    cy.byTestId('live-check-input').type('http://example.com');
    cy.byTestId('live-check-button').click();
    cy.get('[role="alert"]').should('contain.text', 'https');
  });

  it('reports a website that responds', () => {
    cy.intercept('https://www.vitrine-test.example/**', { statusCode: 200, body: 'ok' });
    cy.byTestId('live-check-input').type('www.vitrine-test.example');
    cy.byTestId('live-check-button').click();
    cy.byTestId('live-check-result').should('contain.text', 'responded in');
  });

  it('reports a website that cannot be reached', () => {
    cy.intercept('https://down.vitrine-test.example/**', { forceNetworkError: true });
    cy.byTestId('live-check-input').type('down.vitrine-test.example');
    cy.byTestId('live-check-button').click();
    cy.byTestId('live-check-result').should('contain.text', 'could not reach');
  });
});

describe('A business with a website that is down', () => {
  const options = { businessId: 'fietsatelier-de-spaak' };

  it('makes the problem impossible to miss', () => {
    cy.visitApp('/', options);
    cy.byTestId('health-headline').should('have.text', 'Your website is down');
    cy.byTestId('health-hero').within(() => cy.byTestId('status-critical').should('be.visible'));
  });

  it('shows why sections are unavailable instead of showing old numbers', () => {
    cy.visitApp('/seo', options);
    cy.byTestId('unavailable-card').should('contain.text', 'could not run');
    cy.visitApp('/performance', options);
    cy.byTestId('unavailable-card').should('be.visible');
    cy.visitApp('/reviews', options);
    cy.byTestId('unavailable-card').should('contain.text', 'not connected');
    cy.visitApp('/website', options);
    cy.byTestId('site-down-banner').should('be.visible');
  });

  it('runs the blocked checks after the website is fixed', () => {
    cy.visitApp('/details/site-down', options);
    cy.byTestId('mark-fixed').click();
    cy.byTestId('screen-issue-detail').within(() => cy.byTestId('run-check').click());
    cy.byTestId('issue-resolved', { timeout: 8000 }).should('be.visible');

    cy.get('[data-testid="nav-home"]').click();
    cy.byTestId('health-headline').should('not.have.text', 'Your website is down');
    cy.byTestId('tile-seo').should('not.contain.text', 'Not available');
  });
});

describe('Settings', () => {
  it('switches between businesses', () => {
    cy.visitApp('/settings');
    cy.byTestId('business-praktijk-lindenhof').click();
    cy.get('[data-testid="nav-home"]').click();
    cy.byTestId('health-headline').should('have.text', "You're doing well online");
    cy.byTestId('status-healthy').should('exist');
  });

  it('switches to dark mode and remembers it', () => {
    cy.visitApp('/settings', { themeMode: 'light' });
    cy.byTestId('screen-settings').should('have.css', 'background-color', 'rgb(245, 245, 241)');

    cy.byTestId('theme-dark').click();
    cy.byTestId('screen-settings').should('have.css', 'background-color', 'rgb(17, 20, 18)');

    cy.reload();
    cy.byTestId('screen-settings').should('have.css', 'background-color', 'rgb(17, 20, 18)');
  });

  it('asks for confirmation before resetting, then resets', () => {
    cy.visitApp('/details/broken-links');
    cy.byTestId('mark-fixed').click();
    cy.byTestId('issue-waiting').should('be.visible');

    cy.get('[data-testid="nav-settings"]').click();
    cy.byTestId('reset-demo').click();
    cy.byTestId('reset-confirm').should('be.visible');
    cy.byTestId('reset-confirm-yes').click();
    cy.byTestId('toast').should('contain.text', 'has been reset');

    cy.get('[data-testid="nav-issues"]').click();
    cy.byTestId('waiting-for-check').should('not.exist');
  });

  it('offers a way to install the app', () => {
    cy.visitApp('/settings');
    cy.byTestId('settings-install').should('be.visible');
  });
});

describe('Accessibility basics', () => {
  it('gives every page one main heading', () => {
    for (const path of ['/issues', '/website', '/seo', '/performance', '/reviews', '/settings', '/']) {
      cy.visitApp(path);
      cy.get('[role="heading"][aria-level="1"]:visible').should('have.length', 1);
    }
  });

  it('keeps navigation targets large enough to tap', () => {
    cy.viewport(360, 780);
    cy.visitApp('/');
    for (const id of ['nav-home', 'nav-issues', 'nav-website', 'nav-reviews', 'nav-settings']) {
      cy.byTestId(id).invoke('outerHeight').should('be.at.least', 48);
      cy.byTestId(id).invoke('outerWidth').should('be.at.least', 48);
    }
  });

  it('labels the charts for screen readers', () => {
    cy.visitApp('/');
    cy.byTestId('score-trend').find('[role="group"]').should('have.attr', 'aria-label').and('contain', 'Overall score');
  });
});
