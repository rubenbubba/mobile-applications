// Real offline behaviour is covered by scripts/verify-offline.js, because Cypress's own proxy sits
// between the service worker and the network. This spec checks what makes the app installable.
interface ManifestIcon {
  src: string;
  sizes: string;
  purpose?: string;
}

describe('Install requirements', () => {
  it('links the manifest and sets the app metadata', () => {
    cy.visit('/login');
    cy.document().then((doc) => {
      expect(doc.querySelector('link[rel="manifest"]')?.getAttribute('href')).to.equal('/manifest.json');
      expect(doc.querySelector('link[rel="apple-touch-icon"]')).to.not.equal(null);
      expect(doc.querySelectorAll('meta[name="theme-color"]').length).to.be.at.least(1);
      expect(doc.querySelector('meta[name="viewport"]')?.getAttribute('content')).to.contain('viewport-fit=cover');
    });
    cy.title().should('eq', 'Vitrine');
  });

  it('has a complete manifest', () => {
    cy.request('/manifest.json').then(({ body }) => {
      expect(body.name).to.be.a('string').and.not.equal('');
      expect(body.short_name).to.equal('Vitrine');
      expect(body.start_url).to.equal('/');
      expect(body.scope).to.equal('/');
      expect(body.display).to.equal('standalone');
      expect(body.theme_color).to.match(/^#/);
      expect(body.background_color).to.match(/^#/);

      const icons: ManifestIcon[] = body.icons;
      expect(icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any')).to.equal(true);
      expect(icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any')).to.equal(true);
      expect(icons.some((icon) => icon.purpose === 'maskable')).to.equal(true);

      for (const icon of icons) {
        cy.request(icon.src).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.headers['content-type']).to.contain('image/png');
        });
      }
    });
  });

  it('serves a built service worker with a list of files to save', () => {
    cy.request('/sw.js').then(({ body }) => {
      expect(body).to.not.contain("BUILD_VERSION = 'dev'");
      expect(body).to.not.contain('PRECACHE_URLS = []');
      for (const route of ['"/"', '"/issues"', '"/reviews"', '"/offline.html"', '"/manifest.json"', '"/details/site-down"']) {
        expect(body, route).to.contain(route);
      }
      expect(body).to.contain('Ionicons');
      expect(body).to.not.contain('(app)');
    });
  });

  it('serves the offline fallback page', () => {
    cy.request('/offline.html').its('body').should('contain', "You're offline");
  });

  it('registers the service worker and takes control of the page', () => {
    cy.visitApp('/', { keepServiceWorker: true });
    cy.byTestId('health-hero').should('be.visible');

    // Installing saves every page and bundle first, which takes longer on slow CI machines.
    cy.window()
      .then({ timeout: 45000 }, (win) => win.navigator.serviceWorker.ready)
      .its('active.state')
      .should('be.oneOf', ['activating', 'activated']);

    cy.window().should((win) => {
      expect(win.navigator.serviceWorker.controller, 'controller').to.not.equal(null);
    });

    // Leave nothing behind for the next spec.
    cy.window().then({ timeout: 20000 }, async (win) => {
      const registrations = await win.navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      const names = await win.caches.keys();
      await Promise.all(names.map((name) => win.caches.delete(name)));
    });
  });
});

describe('Offline interface', () => {
  function setOffline(offline: boolean) {
    return Cypress.automation('remote:debugger:protocol', {
      command: 'Network.emulateNetworkConditions',
      params: { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
    });
  }

  beforeEach(() => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.enable', params: {} }));
  });

  afterEach(() => {
    cy.then(() => setOffline(false));
  });

  it('shows a banner, keeps the saved results and blocks new checks', () => {
    cy.visitApp('/');
    cy.byTestId('overall-score').should('be.visible');
    cy.byTestId('offline-banner').should('not.exist');

    cy.byTestId('overall-score').invoke('text').then((scoreBefore) => {
      cy.then(() => setOffline(true));

      cy.byTestId('offline-banner').should('contain.text', "You're offline");
      cy.byTestId('overall-score').should('have.text', scoreBefore);
      cy.byTestId('run-check').should('have.attr', 'aria-disabled', 'true');
      cy.contains('when you are back online').should('be.visible');

      cy.then(() => setOffline(false));
      cy.byTestId('offline-banner').should('not.exist');
    });
  });

  it('still lets you mark an issue as fixed while offline', () => {
    cy.visitApp('/details/broken-links');
    cy.byTestId('mark-fixed').should('be.visible');
    cy.then(() => setOffline(true));
    cy.byTestId('offline-banner').should('be.visible');

    cy.byTestId('mark-fixed').click();
    cy.byTestId('issue-waiting').should('be.visible');
  });

  it('explains the problem when a business was never loaded on this device', () => {
    cy.visitApp('/settings');
    cy.byTestId('settings-business').should('be.visible');
    cy.then(() => setOffline(true));
    cy.byTestId('offline-banner').should('be.visible');

    cy.byTestId('business-praktijk-lindenhof').click();
    cy.get('[data-testid="nav-home"]').click();
    cy.byTestId('load-error').should('contain.text', 'could not load');

    cy.then(() => setOffline(false));
    cy.byTestId('health-hero').should('be.visible');
  });
});
